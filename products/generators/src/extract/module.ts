import { runnerImport } from "vite";

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
 */
export async function importModule<TModule>(modulePath: string): Promise<TModule> {
  const { module } = await runnerImport<TModule>(modulePath);
  return module;
}
