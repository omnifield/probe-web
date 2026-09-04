import { existsSync, readFileSync } from "node:fs";

import { mergeMarkedRegions } from "../preserve/regions.js";
import type { MarkedRegionMarkers } from "../preserve/regions.js";

import { toEntryContext } from "./context.js";
import type { EntryContext } from "./context.js";
import { discoverEntries } from "./scan.js";
import type { DiscoverEntriesOptions } from "./scan.js";
import type { Entry, GeneratedFile } from "./types.js";
import { isAggregatePlugin } from "./types.js";
import type { AggregatePlugin, GeneratorPlugin, PerEntryPlugin } from "./types.js";
import { writeGeneratedFiles } from "./write.js";

export interface GeneratorConfig extends DiscoverEntriesOptions {
  /** Directory whose immediate subdirectories are scanned for entries, shared by every plugin. */
  readonly rootDir: string;
  /** Plugins to run, in order, over the same scan. */
  readonly plugins: readonly GeneratorPlugin[];
}

/**
 * Identity function — exists so a product's config file reads like `vite.config.ts`'s
 * `defineConfig`: an editor gets full types on a plain object literal, no manual annotation.
 */
export function defineConfig(config: GeneratorConfig): GeneratorConfig {
  return config;
}

function markersFor(zone: string): MarkedRegionMarkers {
  return { start: `<!-- gen:${zone}:start -->`, end: `<!-- gen:${zone}:end -->` };
}

/**
 * Merges a plugin's declared zones into its freshly rendered files, reading
 * whatever is currently on disk at each path. A plugin with no `zones`
 * passes its files through untouched — the filesystem read only happens for
 * plugins that actually asked for it (`../preserve`'s own README: this is
 * the caller's job, not something every generation run pays for).
 */
function mergeZones(plugin: GeneratorPlugin, files: readonly GeneratedFile[]): GeneratedFile[] {
  if (!plugin.zones || plugin.zones.length === 0) return [...files];
  return files.map((file) => {
    const existingContent = existsSync(file.path) ? readFileSync(file.path, "utf8") : undefined;
    const content = plugin.zones!.reduce((acc, zone) => mergeMarkedRegions(acc, existingContent, markersFor(zone)), file.content);
    return { path: file.path, content };
  });
}

/** One output from every entry at once: collect → validate → render, no filesystem write yet. */
async function runAggregatePlugin(plugin: AggregatePlugin, entries: readonly EntryContext[]): Promise<GeneratedFile[]> {
  const items = await plugin.collect(entries);
  await plugin.validate?.(items);
  const content = await plugin.render(items);
  return [{ path: plugin.output, content }];
}

/** One output PER entry: collect → validate → render, once per entry, in order (not `Promise.all` — output order should not depend on which async step resolves first). */
async function runPerEntryPlugin(plugin: PerEntryPlugin, entries: readonly EntryContext[]): Promise<GeneratedFile[]> {
  const files: GeneratedFile[] = [];
  for (const entry of entries) {
    const item = await plugin.collect(entry);
    await plugin.validate?.(item, entry);
    const content = await plugin.render(item);
    files.push({ path: plugin.outputFor(entry), content });
  }
  return files;
}

/**
 * Runs every plugin over one shared scan: discovers entries once, wraps
 * each in an `EntryContext` (`./context.ts`), then lets each plugin
 * collect/validate/render/zone-merge on its own. Plugins run in order, one
 * at a time — not `Promise.all`, so two plugins touching overlapping
 * output never race.
 */
export async function run(config: GeneratorConfig): Promise<GeneratedFile[]> {
  const entries: Entry[] = discoverEntries(config.rootDir, config);
  const allContexts = entries.map(toEntryContext);

  const written: GeneratedFile[] = [];
  for (const plugin of config.plugins) {
    await plugin.setup?.();
    const contexts = plugin.isEntry ? allContexts.filter((entry) => plugin.isEntry!(entry)) : allContexts;
    const files = isAggregatePlugin(plugin) ? await runAggregatePlugin(plugin, contexts) : await runPerEntryPlugin(plugin, contexts);
    written.push(...mergeZones(plugin, files));
  }

  writeGeneratedFiles(written);
  return written;
}
