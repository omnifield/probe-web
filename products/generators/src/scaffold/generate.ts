import type { Entry, GeneratedFile } from "../barrel/types.js";
import type { ScaffoldSpec } from "./types.js";

/**
 * Runs one scaffold spec over every entry: collect its item, validate it,
 * render the text — once per entry, each producing its own file. Pure aside
 * from awaiting — no filesystem writes happen here, same discipline as
 * `generateBarrels` (`../barrel/generate.ts`). Entries run one at a time,
 * not `Promise.all`: output order should not depend on which async step
 * happened to resolve first.
 */
export async function generateScaffoldFiles<TItem>(entries: readonly Entry[], spec: ScaffoldSpec<TItem>): Promise<GeneratedFile[]> {
  const files: GeneratedFile[] = [];
  for (const entry of entries) {
    const item = await spec.collect(entry);
    await spec.validate?.(item, entry);
    const content = await spec.render(item);
    files.push({ path: spec.outputPathFor(entry), content });
  }
  return files;
}
