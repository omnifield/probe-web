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
  readonly rootDir: string;
  readonly plugins: readonly GeneratorPlugin[];
}

export function defineConfig(config: GeneratorConfig): GeneratorConfig {
  return config;
}

function markersFor(zone: string): MarkedRegionMarkers {
  return { start: `<!-- gen:${zone}:start -->`, end: `<!-- gen:${zone}:end -->` };
}

function mergeZones(plugin: GeneratorPlugin, files: readonly GeneratedFile[]): GeneratedFile[] {
  if (!plugin.zones || plugin.zones.length === 0) return [...files];
  return files.map((file) => {
    const existingContent = existsSync(file.path) ? readFileSync(file.path, "utf8") : undefined;
    const content = plugin.zones!.reduce((acc, zone) => mergeMarkedRegions(acc, existingContent, markersFor(zone)), file.content);
    return { path: file.path, content };
  });
}

async function runAggregatePlugin(plugin: AggregatePlugin, entries: readonly EntryContext[]): Promise<GeneratedFile[]> {
  const items = await plugin.collect(entries);
  await plugin.validate?.(items);
  const content = await plugin.render(items);
  return [{ path: plugin.output, content }];
}

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
