import { readdirSync } from "node:fs";
import { join } from "node:path";

import type { Entry } from "./types.js";

export interface DiscoverEntriesOptions {
  readonly isEntry: (entryPath: string, entryName: string) => boolean;
}

export function discoverEntries(rootDir: string, options: DiscoverEntriesOptions): Entry[] {
  return readdirSync(rootDir, { withFileTypes: true })
    .filter((item) => item.isDirectory())
    .map((item): Entry => ({ name: item.name, path: join(rootDir, item.name) }))
    .filter((entry) => options.isEntry(entry.path, entry.name))
    .sort((a, b) => a.name.localeCompare(b.name));
}
