import { createServer, mergeConfig, type InlineConfig } from "vite";

/**
 * Imports a TypeScript module by EXECUTING it — through Vite's own transform
 * pipeline (the same one Vitest already runs on top of), not by parsing its
 * source as text. This is the reliable way to read a value like a passport:
 * it is built by calling helper functions (`definePassport`,
 * `defineSettings()()`), and a static/AST reader would have to reimplement
 * what those functions do just to guess the result. Importing gets the REAL,
 * fully-resolved object — no risk of drifting from what the running app
 * actually sees.
 *
 * Resolves this repository's own import convention out of the box: a
 * relative specifier written with a `.js` extension that points at a
 * sibling `.ts` file resolves correctly, the same way Vite resolves it for
 * the real build — no separate compile step, unlike plain Node.
 *
 * Runs on `createServer()` + `server.ssrLoadModule()`, not the lower-level
 * `runnerImport()` this used to wrap. `runnerImport`'s "inline" environment
 * hardcodes `resolve.external: true` with no CJS interop for anything a
 * caller marks `noExternal` (verified: it gets as far as attempting the
 * bundle, then fails on `require is not defined` — that environment has no
 * CJS runtime under it at all). The classic dev-server path a real `vite
 * dev` uses does have one — same pattern this repo's own
 * `packages/build/src/vite.ts` already runs its `generatedCssPlugin`
 * through (`server.ssrLoadModule`).
 *
 * `config` is an escape hatch for what a caller's OWN files need, not
 * something this generic tool bakes in — it stays framework/package
 * agnostic on purpose (see the module README). Two known uses: a module
 * transitively importing a CommonJS package with no `exports` map (e.g.
 * `fast-json-patch` under `@omnifield/probe-web-io`) needs
 * `{ ssr: { noExternal: ["that-package"] } }`; a `.tsx` file with real
 * Solid JSX needs `{ plugins: [solid()] }` (`vite-plugin-solid`, not a
 * dependency of this package). Merged with this function's own required
 * settings taking priority on conflicts — a caller can add plugins or
 * widen `noExternal`, not turn off the headless SSR mode this relies on.
 */
export async function importModule<TModule>(modulePath: string, config: InlineConfig = {}): Promise<TModule> {
  const server = await createServer(
    mergeConfig(config, {
      configFile: false,
      root: process.cwd(),
      server: { middlewareMode: true },
      appType: "custom",
    } satisfies InlineConfig),
  );
  try {
    return (await server.ssrLoadModule(modulePath)) as TModule;
  } finally {
    await server.close();
  }
}
