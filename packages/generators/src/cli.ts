#!/usr/bin/env node
// THE ENTRY POINT — the one thing a product actually invokes. Mirrors `vite`'s own CLI: a product
// writes a config file (TypeScript, `export default defineConfig({ rootDir, isEntry, plugins })`),
// and runs it through this instead of hand-writing `fileURLToPath`/`dirname`/`await run(...)`
// boilerplate itself (`packages/ui/generators/*.mjs`'s old shape).
//
// Loads the config by EXECUTING it (`../extract`'s `importModule`), same reason as everywhere else
// in this package: a config built by calling `defineConfig({...})` is a real value once it runs,
// not text worth parsing.
import { pathToFileURL } from "node:url";

import { importModule } from "./extract/module.js";
import type { GeneratedFile } from "./engine/types.js";
import type { GeneratorConfig } from "./engine/runner.js";
import { run } from "./engine/runner.js";

interface ConfigModule {
  readonly default?: GeneratorConfig;
}

/** Loads a config file and runs it — the one call a caller (CLI or test) actually needs. */
export async function runCli(configPath: string): Promise<GeneratedFile[]> {
  const configModule = await importModule<ConfigModule>(configPath);
  const config = configModule.default;
  if (!config || !Array.isArray(config.plugins)) {
    throw new Error(`${configPath} must \`export default defineConfig({ rootDir, isEntry, plugins })\``);
  }
  return run(config);
}

// The ESM equivalent of `require.main === module` — true only when this file is the process's own
// entry point (`node dist/cli.js ...`), false when another module imports `runCli` from it (tests).
const isMainModule = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  const configPath = process.argv[2];
  if (!configPath) {
    console.error("usage: web-core-generate <path-to-config.ts>");
    process.exit(1);
  }
  const written = await runCli(configPath);
  console.log(`web-core-generate: wrote ${written.length} file(s) from ${configPath}`);
}
