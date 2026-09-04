// Точка поверхности `/vite` (`PROBEWEB-4`). Разбор — README.md/FAQ.md рядом.
import { isAbsolute, resolve, sep } from "node:path";

import {
  normalizePath,
  type EnvironmentModuleNode,
  type Plugin,
  type UserConfig,
  type ViteDevServer,
} from "vite";
import solid from "vite-plugin-solid";

import { trace } from "../shared/trace.js";
import { findWorkspaceSources, type GeneratedCss } from "./workspace-source.js";

/** Разбор дерева, общий на оба дев-плагина — считается один раз в хуке `config`. */
interface DevState {
  generated: GeneratedCss[];
}

/** Дев-плагин: соседи по воркспейсу видны исходниками и не пребандлятся. См. README.md «Дев-цикл». */
function workspaceSourcePlugin(state: DevState): Plugin {
  return {
    name: "probe-web-build:workspace-source",
    apply: "serve",
    config(config) {
      const done = trace("workspaceSourcePlugin.config");
      const projectRoot = resolve(config.root ?? process.cwd());
      const { names, roots, aliases, generated } = findWorkspaceSources(projectRoot);
      done();

      state.generated = generated;
      if (names.length === 0) return undefined;

      return {
        resolve: { alias: aliases },
        optimizeDeps: { exclude: names },
        // Корень приложения первым — заданный список ОТМЕНЯЕТ умолчание Vite (см. FAQ.md).
        server: { fs: { allow: [projectRoot, ...roots] } },
      } satisfies UserConfig;
    },
  };
}

/** Лежит ли файл внутри папки — по границе сегмента, не по префиксу строки. */
function isInside(root: string, file: string): boolean {
  return file === root || file.startsWith(root.endsWith(sep) ? root : root + sep);
}

/** Дев-плагин: CSS соседа порождается на запрос, а не читается из его сборки. См. README.md «Дев-цикл». */
function generatedCssPlugin(state: DevState): Plugin {
  let server: ViteDevServer | undefined;

  return {
    name: "probe-web-build:generated-css",
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

/** Опции, которые вывести неоткуда — обычный потребитель не передаёт ничего. */
export interface DefineConfigOptions {
  readonly base?: string;
  readonly proxy?: NonNullable<UserConfig["server"]>["proxy"];
  readonly plugins?: readonly Plugin[];
}

/** Готовый конфиг Vite для приложения на web-core. */
export function defineConfig(options: DefineConfigOptions = {}): UserConfig {
  const done = trace("defineConfig");

  const state: DevState = { generated: [] };

  const config: UserConfig = {
    ...(options.base ? { base: options.base } : {}),
    plugins: [solid(), workspaceSourcePlugin(state), generatedCssPlugin(state), ...(options.plugins ?? [])],
    server: {
      host: true, // не "localhost" — см. FAQ.md
      ...(options.proxy ? { proxy: options.proxy } : {}),
    },
  };

  done();
  return config;
}

// Вторая работа того же подпутя — сборка БИБЛИОТЕКИ вместо приложения. Разбор — README.md
// «Библиотека».

/** Один вход поставки библиотеки. */
export interface LibraryEntry {
  readonly name: string;
  readonly source: string;
  /** Отдаёт JSX — уезжает дополнительной веткой `dist/<name>.jsx`, см. README.md. */
  readonly solid?: boolean;
}

/** Опции сборки поставки библиотеки. */
export interface DefineLibraryConfigOptions {
  readonly entries: readonly LibraryEntry[];
}

/** Внешние зависимости бандла: любой спецификатор не относительным и не абсолютным путём. */
function externalizeDependencies(id: string): boolean {
  return !id.startsWith(".") && !isAbsolute(id);
}

/** Ветка `solid` (непреобразованный JSX) для входов с `solid: true`. Почему esbuild — FAQ.md. */
async function buildRawJsxBranch(root: string, entries: readonly LibraryEntry[]): Promise<void> {
  const { build } = await import("esbuild");
  for (const entry of entries) {
    await build({
      entryPoints: [resolve(root, entry.source)],
      bundle: true,
      format: "esm",
      platform: "browser",
      target: "es2023",
      jsx: "preserve",
      packages: "external",
      sourcemap: true,
      sourcesContent: true, // исходники в тарбол не едут — карта обязана нести их в себе
      outfile: resolve(root, "dist", `${entry.name}.jsx`),
    });
  }
}

/** Готовый конфиг Vite для сборки библиотеки web-core (library mode). Разбор — README.md. */
export function defineLibraryConfig(options: DefineLibraryConfigOptions): UserConfig {
  const solidEntries = options.entries.filter((entry) => entry.solid);

  return {
    plugins: [
      solid(),
      solidEntries.length > 0
        ? {
            name: "probe-web-build:library-raw-jsx",
            apply: "build",
            async closeBundle() {
              await buildRawJsxBranch(process.cwd(), solidEntries);
            },
          }
        : undefined,
    ],
    build: {
      target: "es2023",
      sourcemap: true,
      lib: {
        entry: Object.fromEntries(
          options.entries.map((entry) => [entry.name, resolve(process.cwd(), entry.source)]),
        ),
        formats: ["es"],
        fileName: (_format, entryName) => `${entryName}.js`,
      },
      rollupOptions: { external: externalizeDependencies },
    },
  };
}
