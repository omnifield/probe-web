#!/usr/bin/env node
import { pathToFileURL } from "node:url";

import { importModule } from "./extract/module.js";
import type { GeneratedFile } from "./engine/types.js";
import type { GeneratorConfig } from "./engine/runner.js";
import { run } from "./engine/runner.js";

interface ConfigModule {
  readonly default?: GeneratorConfig;
}

export async function runCli(configPath: string): Promise<GeneratedFile[]> {
  const configModule = await importModule<ConfigModule>(configPath);
  const config = configModule.default;
  if (!config || !Array.isArray(config.plugins)) {
    throw new Error(`${configPath} must \`export default defineConfig({ rootDir, isEntry, plugins })\``);
  }
  return run(config);
}

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
