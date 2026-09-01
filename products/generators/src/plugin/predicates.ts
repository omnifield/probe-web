import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * The one raw-filesystem step that genuinely cannot go through
 * `EntryContext` (`./context.ts`): deciding whether a scanned directory
 * counts as an entry AT ALL happens before any `EntryContext` for it
 * exists. `hasFile` covers the common case — "this entry has file X" — as
 * a config-level predicate, so a product's `isEntry` reads as data
 * (`hasFile("entity/passport.ts")`) instead of a hand-written
 * `existsSync(join(...))` closure.
 */
export function hasFile(relativePath: string): (entryPath: string) => boolean {
  return (entryPath) => existsSync(join(entryPath, relativePath));
}
