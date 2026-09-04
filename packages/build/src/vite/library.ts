// см. README.md / FAQ.md
import { isAbsolute, resolve } from "node:path";

import type { UserConfig } from "vite";
import solid from "vite-plugin-solid";

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
            name: "web-core-build:library-raw-jsx",
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
