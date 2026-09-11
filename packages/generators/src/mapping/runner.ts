import type { MappingTemplate } from "./types.js";

export async function run<TOutput = unknown>(raw: string, templates: readonly MappingTemplate<unknown, TOutput>[]): Promise<TOutput> {
  const template = templates.find((candidate) => candidate.isEntry(raw));
  if (!template) {
    const tried = templates.map((candidate) => candidate.name).join(", ") || "(no templates registered)";
    throw new Error(`mapping.run: none of the templates recognize this input — tried: ${tried}`);
  }

  const items = await template.collect(raw);
  await template.validate?.(items);
  return template.render(items);
}
