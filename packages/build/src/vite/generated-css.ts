// см. README.md / FAQ.md
import { sep } from "node:path";

import { normalizePath, type EnvironmentModuleNode, type Plugin, type ViteDevServer } from "vite";

import { trace } from "../shared/trace.js";
import type { DevState } from "./workspace-source.js";

/** Лежит ли файл внутри папки — по границе сегмента, не по префиксу строки. */
function isInside(root: string, file: string): boolean {
  return file === root || file.startsWith(root.endsWith(sep) ? root : root + sep);
}

/** Дев-плагин: CSS соседа порождается на запрос, а не читается из его сборки. См. README.md «Дев-цикл». */
export function generatedCssPlugin(state: DevState): Plugin {
  let server: ViteDevServer | undefined;

  return {
    name: "web-core-build:generated-css",
    apply: "serve",
    enforce: "pre", // до разрешения по exports — иначе Vite уходит за файлом в dist

    configureServer(current) {
      server = current;
    },

    resolveId(source) {
      return state.generated.find((entry) => entry.specifier === source)?.id;
    },

    async load(id) {
      const entry = state.generated.find((candidate) => candidate.id === id);
      if (!entry || !server) return undefined;

      const done = trace(`generatedCss ${entry.specifier}`);
      const module = await server.ssrLoadModule(`/@fs/${normalizePath(entry.generator)}`);
      const generate: unknown = module[entry.exportName];
      done();

      if (typeof generate !== "function") return undefined;
      return String((generate as () => unknown)());
    },

    hotUpdate({ file, modules }) {
      if (this.environment.name !== "client") return undefined;

      const stale: EnvironmentModuleNode[] = [];
      for (const entry of state.generated) {
        if (!isInside(entry.root, file)) continue;

        const module = this.environment.moduleGraph.getModuleById(entry.id);
        if (!module) continue;

        this.environment.moduleGraph.invalidateModule(module);
        stale.push(module);
      }

      return stale.length > 0 ? [...modules, ...stale] : undefined;
    },
  };
}
