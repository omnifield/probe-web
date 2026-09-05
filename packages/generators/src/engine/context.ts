import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { InlineConfig } from "vite";

import { importModule } from "../extract/module.js";
import type { Entry } from "./types.js";

export interface EntryContext extends Entry {
  resolve(relativePath: string): string;
  has(relativePath: string): boolean;
  read(relativePath: string): string;
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
