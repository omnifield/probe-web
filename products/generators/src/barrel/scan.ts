import { readdirSync } from "node:fs";
import { join } from "node:path";

import type { Entry } from "./types.js";

export interface DiscoverEntriesOptions {
  /**
   * Decides whether a directory counts as an entry at all. Receives the
   * directory's absolute path and its bare name. A folder that fails this
   * check is invisible to every barrel — it is skipped, not an error.
   */
  readonly isEntry: (entryPath: string, entryName: string) => boolean;
}

/**
 * Lists the immediate subdirectories of `rootDir` that satisfy `isEntry`,
 * sorted by name so output is stable across runs and machines.
 *
 * Only one scan happens per generation, shared by every barrel spec — several
 * scans with their own filters would drift apart on the first folder that
 * matches one filter and not the other.
 */
export function discoverEntries(rootDir: string, options: DiscoverEntriesOptions): Entry[] {
  return readdirSync(rootDir, { withFileTypes: true })
    .filter((item) => item.isDirectory())
    .map((item): Entry => ({ name: item.name, path: join(rootDir, item.name) }))
    .filter((entry) => options.isEntry(entry.path, entry.name))
    .sort((a, b) => a.name.localeCompare(b.name));
}
