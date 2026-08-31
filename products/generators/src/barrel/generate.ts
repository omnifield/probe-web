import type { BarrelSpec, Entry, GeneratedFile } from "./types.js";

/**
 * Runs every barrel spec over the same entry list: collect its items,
 * validate them, render the text. Pure aside from awaiting — no filesystem
 * writes happen here, so a caller can inspect or diff the result before
 * anything touches disk. Specs run in order, one at a time (not
 * `Promise.all`): output order should not depend on which async step
 * happened to resolve first.
 */
export async function generateBarrels(entries: readonly Entry[], specs: readonly BarrelSpec[]): Promise<GeneratedFile[]> {
  const files: GeneratedFile[] = [];
  for (const spec of specs) {
    const items = await spec.collect(entries);
    await spec.validate?.(items);
    const content = await spec.render(items);
    files.push({ path: spec.outputPath, content });
  }
  return files;
}
