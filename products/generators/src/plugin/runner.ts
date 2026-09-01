import { existsSync, readFileSync } from "node:fs";

import { generateBarrels } from "../barrel/generate.js";
import { discoverEntries } from "../barrel/scan.js";
import type { DiscoverEntriesOptions } from "../barrel/scan.js";
import type { BarrelSpec, Entry, GeneratedFile } from "../barrel/types.js";
import { writeGeneratedFiles } from "../barrel/write.js";
import { mergeMarkedRegions } from "../preserve/regions.js";
import type { MarkedRegionMarkers } from "../preserve/regions.js";
import { generateScaffoldFiles } from "../scaffold/generate.js";
import type { ScaffoldSpec } from "../scaffold/types.js";

import { toEntryContext } from "./context.js";
import type { EntryContext } from "./context.js";
import { isAggregatePlugin } from "./types.js";
import type { AggregatePlugin, GeneratorPlugin, PerEntryPlugin } from "./types.js";

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

// `generateBarrels`/`generateScaffoldFiles` type their specs against `Entry`
// (`../barrel/types.ts`), the narrow common shape every caller of those two
// engines shares. A plugin's `collect`/`validate` are typed against
// `EntryContext` instead — a strict superset, only richer — so the cast
// below is safe: this runner always calls the engines with the
// `EntryContext[]`/`EntryContext` built in `run`, never a bare `Entry`.

async function runAggregate(plugin: AggregatePlugin, entries: readonly EntryContext[]): Promise<GeneratedFile[]> {
  const spec = { outputPath: plugin.output, collect: plugin.collect, validate: plugin.validate, render: plugin.render } as unknown as BarrelSpec;
  return generateBarrels(entries, [spec]);
}

async function runPerEntry(plugin: PerEntryPlugin, entries: readonly EntryContext[]): Promise<GeneratedFile[]> {
  const spec = {
    outputPathFor: plugin.outputFor,
    collect: plugin.collect,
    validate: plugin.validate,
    render: plugin.render,
  } as unknown as ScaffoldSpec;
  return generateScaffoldFiles(entries, spec);
}

/**
 * Runs every plugin over one shared scan: discovers entries once, wraps
 * each in an `EntryContext` (`./context.ts`), then lets each plugin
 * collect/validate/render/zone-merge on its own — aggregate plugins through
 * `generateBarrels`, per-entry plugins through `generateScaffoldFiles`, the
 * same tested engines a hand-written script used to call directly. Plugins
 * run in order, one at a time — not `Promise.all`, so two plugins touching
 * overlapping output never race.
 */
export async function run(config: GeneratorConfig): Promise<GeneratedFile[]> {
  const entries: Entry[] = discoverEntries(config.rootDir, config);
  const allContexts = entries.map(toEntryContext);

  const written: GeneratedFile[] = [];
  for (const plugin of config.plugins) {
    await plugin.setup?.();
    const contexts = plugin.isEntry ? allContexts.filter((entry) => plugin.isEntry!(entry)) : allContexts;
    const files = isAggregatePlugin(plugin) ? await runAggregate(plugin, contexts) : await runPerEntry(plugin, contexts);
    written.push(...mergeZones(plugin, files));
  }

  writeGeneratedFiles(written);
  return written;
}
