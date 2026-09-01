import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { InlineConfig } from "vite";

import type { Entry } from "../barrel/types.js";
import { importModule } from "../extract/module.js";

/**
 * An `Entry` (`../barrel/types.ts`) with the filesystem operations a plugin
 * actually needs, so plugin code never imports `node:fs`/`node:path`
 * itself: every relative path a plugin names is resolved against THIS
 * entry, once, in one place.
 */
export interface EntryContext extends Entry {
  /** Absolute path for a path relative to this entry — for `outputFor`, mainly. */
  resolve(relativePath: string): string;
  /** Whether a file exists at a path relative to this entry. */
  has(relativePath: string): boolean;
  /** Raw text of a file relative to this entry. */
  read(relativePath: string): string;
  /** Imports a module relative to this entry by executing it (`../extract`'s `importModule`), not parsing its text. */
  importModule<TModule>(relativePath: string, config?: InlineConfig): Promise<TModule>;
}

export function toEntryContext(entry: Entry): EntryContext {
  const resolve = (relativePath: string) => join(entry.path, relativePath);
  return {
    ...entry,
    resolve,
    has: (relativePath) => existsSync(resolve(relativePath)),
    read: (relativePath) => readFileSync(resolve(relativePath), "utf8"),
    importModule: (relativePath, config) => importModule(resolve(relativePath), config),
  };
}
