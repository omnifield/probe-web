import type { Entry } from "../barrel/types.js";

/**
 * One file to produce PER ENTRY — the mirror image of `BarrelSpec`
 * (`../barrel/types.ts`), which produces one file from ALL entries. `TItem`
 * is whatever shape `collect` builds for a single entry; this module never
 * assumes what that shape is, only that it turns one entry into one file.
 */
export interface ScaffoldSpec<TItem = unknown> {
  /** Where this entry's file is written — a function of the entry, since every entry gets its own path. */
  outputPathFor(entry: Entry): string;
  /**
   * Narrows/maps one entry down to what its file needs. May do its own
   * filesystem or module reads — often IMPORTING a real module (`extract`'s
   * `importModule`), which is inherently asynchronous, hence the return type.
   */
  collect(entry: Entry): TItem | Promise<TItem>;
  /**
   * Optional invariant check over one entry's collected item, run before
   * `render`. Throw with a message naming the entry — this is the only
   * chance to fail loudly instead of writing a file for data that is wrong.
   */
  validate?(item: TItem, entry: Entry): void | Promise<void>;
  /** Turns one entry's collected item into that file's full text content. */
  render(item: TItem): string | Promise<string>;
}
