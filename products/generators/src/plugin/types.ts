import type { EntryContext } from "./context.js";

/**
 * Produces ONE output file from ALL entries at once — the plugin-shaped
 * twin of `BarrelSpec` (`../barrel/types.ts`), same contract, `EntryContext`
 * instead of bare `Entry`.
 */
export interface AggregatePlugin<TItem = unknown> {
  /** Identifies the plugin in logs/errors — not used for anything mechanical. */
  readonly name: string;
  /** Absolute path the rendered content is written to. */
  readonly output: string;
  /** Narrows this plugin's view of the scan — an entry failing this check never reaches `collect`. Omit to see every entry the root scan found. */
  isEntry?(entry: EntryContext): boolean;
  /** Runs once, before any entry is collected — for a dependency the plugin needs once, not per entry (e.g. importing a shared schema module). */
  setup?(): void | Promise<void>;
  /** Narrows/maps the entry list down to what this file needs. */
  collect(entries: readonly EntryContext[]): readonly TItem[] | Promise<readonly TItem[]>;
  /** Optional invariant check over the collected items, run before `render`. */
  validate?(items: readonly TItem[]): void | Promise<void>;
  /** Turns collected items into the file's full text content. */
  render(items: readonly TItem[]): string | Promise<string>;
  /**
   * Named hand-written regions that survive regeneration — each becomes one
   * `mergeMarkedRegions` (`../preserve`) call, done by the runner between
   * `render` and writing. A template declaring a zone must render its own
   * placeholder between `<!-- gen:<zone>:start -->`/`<!-- gen:<zone>:end -->`.
   */
  readonly zones?: readonly string[];
}

/**
 * Produces ONE output file PER ENTRY — the plugin-shaped twin of
 * `ScaffoldSpec` (`../scaffold/types.ts`).
 */
export interface PerEntryPlugin<TItem = unknown> {
  readonly name: string;
  /** Where this entry's file is written — a function of the entry, since every entry gets its own path. */
  outputFor(entry: EntryContext): string;
  isEntry?(entry: EntryContext): boolean;
  setup?(): void | Promise<void>;
  /** Narrows/maps one entry down to what its file needs. */
  collect(entry: EntryContext): TItem | Promise<TItem>;
  /** Optional invariant check over one entry's collected item, run before `render`. */
  validate?(item: TItem, entry: EntryContext): void | Promise<void>;
  /** Turns one entry's collected item into that file's full text content. */
  render(item: TItem): string | Promise<string>;
  /** Same zone mechanism as `AggregatePlugin.zones`, applied to every entry's own file independently. */
  readonly zones?: readonly string[];
}

export type GeneratorPlugin<TItem = unknown> = AggregatePlugin<TItem> | PerEntryPlugin<TItem>;

/** Distinguishes the two plugin shapes by the field only one of them has. */
export function isAggregatePlugin(plugin: GeneratorPlugin): plugin is AggregatePlugin {
  return "output" in plugin;
}
