/**
 * Shared types for the barrel generator. Kept in one file because every other
 * module in this folder imports from here — a single source avoids the same
 * shape drifting apart across scan/generate/write.
 */

/** A directory discovered under the scanned root. */
export interface Entry {
  /** Directory name, e.g. "accordion". */
  readonly name: string;
  /** Absolute path to the directory. */
  readonly path: string;
}

/** A file this tool is about to write: destination path plus rendered text. */
export interface GeneratedFile {
  readonly path: string;
  readonly content: string;
}

/**
 * One barrel to produce. `TItem` is whatever shape `collect` chooses to build
 * per entry — this module never assumes what a barrel contains, only that it
 * turns entries into text.
 */
export interface BarrelSpec<TItem = unknown> {
  /** Absolute path the rendered content is written to. */
  readonly outputPath: string;
  /**
   * Narrows/maps the full entry list down to what this barrel needs. May
   * filter entries out (e.g. an optional module some entries never declare)
   * and may do its own filesystem checks to do so.
   */
  collect(entries: readonly Entry[]): readonly TItem[] | Promise<readonly TItem[]>;
  /**
   * Optional invariant check over the collected items, run before `render`.
   * Throw with a message naming the offending entry — this is the only
   * chance to fail loudly instead of writing a barrel that references a
   * module which does not exist.
   */
  validate?(items: readonly TItem[]): void | Promise<void>;
  /**
   * Turns collected items into the file's full text content. May be async:
   * `collect` often reads data by IMPORTING a real module (`extract`'s
   * `importModule`), and that import is inherently asynchronous — `render`
   * can be too, for a template step that needs one more async lookup.
   */
  render(items: readonly TItem[]): string | Promise<string>;
}
