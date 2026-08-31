import { discoverEntries } from "../barrel/scan.js";
import type { DiscoverEntriesOptions } from "../barrel/scan.js";
import type { GeneratedFile } from "../barrel/types.js";
import { writeGeneratedFiles } from "../barrel/write.js";
import { generateScaffoldFiles } from "./generate.js";
import type { ScaffoldSpec } from "./types.js";

export interface RunScaffoldGenerationOptions<TItem> extends DiscoverEntriesOptions {
  /** Directory whose immediate subdirectories are scanned for entries. */
  readonly rootDir: string;
  /** The one file-per-entry spec to run. */
  readonly spec: ScaffoldSpec<TItem>;
}

/** The convenience entry point: scan, generate, write, in one call — the scaffold-side twin of `runBarrelGeneration`. */
export async function runScaffoldGeneration<TItem>(options: RunScaffoldGenerationOptions<TItem>): Promise<GeneratedFile[]> {
  const entries = discoverEntries(options.rootDir, options);
  const files = await generateScaffoldFiles(entries, options.spec);
  writeGeneratedFiles(files);
  return files;
}
