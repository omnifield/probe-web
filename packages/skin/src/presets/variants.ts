import { DEFAULT_TAG } from "../tags/index.js";
import { readWorn } from "../wear/root.js";

import { PRESET_KIND, type PresetsClient } from "./client/index.js";

export interface VariantSummary {
  readonly name: string;
  readonly tags: readonly string[];
}

/** `readWorn()` живёт в `wear/` и рассчитан на браузер — здесь его зовут и из мест без документа
 *  (Node-тесты, SSR), поэтому глушим отказ так же, как «наряд не найден». */
function currentOutfitName(): string | null {
  try {
    return readWorn();
  } catch {
    return null;
  }
}

export async function variantsOf(
  client: PresetsClient,
  component: string,
): Promise<readonly VariantSummary[]>;
export async function variantsOf(
  client: PresetsClient,
  outfitName: string,
  component: string,
): Promise<readonly VariantSummary[]>;
export async function variantsOf(
  client: PresetsClient,
  outfitNameOrComponent: string,
  maybeComponent?: string,
): Promise<readonly VariantSummary[]> {
  const outfitName = maybeComponent === undefined ? currentOutfitName() : outfitNameOrComponent;
  const component = maybeComponent === undefined ? outfitNameOrComponent : maybeComponent;

  if (outfitName === null) return [];

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
