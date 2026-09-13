import { DEFAULT_TAG } from "../tags/index.js";

import { PRESET_KIND, type PresetsClient } from "./client/index.js";

export interface VariantSummary {
  readonly name: string;
  readonly tags: readonly string[];
}

export async function variantsOf(
  client: PresetsClient,
  outfitName: string,
  component: string,
): Promise<readonly VariantSummary[]> {
  const outfit = await client.get(PRESET_KIND.outfit, outfitName);
  if (outfit === undefined) return [];

  const candidates = await client.list(PRESET_KIND.form, { component: [component] });
  const form = candidates.find((candidate) => outfit.state.forms.includes(candidate.name));
  if (form === undefined) return [];

  return Object.keys(form.state.recipe.variants ?? {}).map((name) => ({
    name,
    tags: form.state.variantTags?.[name] ?? [DEFAULT_TAG],
  }));
}
