import type { EntryContext } from "./context.js";

export interface Entry {
  readonly name: string;
  readonly path: string;
}

export interface GeneratedFile {
  readonly path: string;
  readonly content: string;
}

export interface AggregatePlugin<TItem = unknown> {
  readonly name: string;
  readonly output: string;
  isEntry?(entry: EntryContext): boolean;
  setup?(): void | Promise<void>;
  collect(entries: readonly EntryContext[]): readonly TItem[] | Promise<readonly TItem[]>;
  validate?(items: readonly TItem[]): void | Promise<void>;
  render(items: readonly TItem[]): string | Promise<string>;
  readonly zones?: readonly string[];
}

export interface PerEntryPlugin<TItem = unknown> {
  readonly name: string;
  outputFor(entry: EntryContext): string;
  isEntry?(entry: EntryContext): boolean;
  setup?(): void | Promise<void>;
  collect(entry: EntryContext): TItem | Promise<TItem>;
  validate?(item: TItem, entry: EntryContext): void | Promise<void>;
  render(item: TItem): string | Promise<string>;
  readonly zones?: readonly string[];
}

export type GeneratorPlugin<TItem = unknown> = AggregatePlugin<TItem> | PerEntryPlugin<TItem>;

export function isAggregatePlugin(plugin: GeneratorPlugin): plugin is AggregatePlugin {
  return "output" in plugin;
}
