import { generateBarrels } from "./generate.js";
import { discoverEntries } from "./scan.js";
import type { DiscoverEntriesOptions } from "./scan.js";
import type { BarrelSpec, GeneratedFile } from "./types.js";
import { writeGeneratedFiles } from "./write.js";

export interface RunBarrelGenerationOptions extends DiscoverEntriesOptions {
  /** Directory whose immediate subdirectories are scanned for entries. */
  readonly rootDir: string;
  /** Barrels to produce from the discovered entries. */
  readonly specs: readonly BarrelSpec[];
}

/**
 * The convenience entry point: scan, generate, write, in one call. Returns
 * what was written so a caller can log it or assert on it without re-reading
 * the files back from disk.
 */
export async function runBarrelGeneration(options: RunBarrelGenerationOptions): Promise<GeneratedFile[]> {
  const entries = discoverEntries(options.rootDir, options);
  const files = await generateBarrels(entries, options.specs);
  writeGeneratedFiles(files);
  return files;
}
