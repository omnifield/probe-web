import { presetsClient } from "#/shared/api/clients";
import {
  variantsOf as variantsOfOutfit,
  type VariantSummary,
} from "@web-core/skin/presets";

export function palettesOf() {
  return presetsClient.list("palette");
}

export function assembliesOf(componentName: string) {
  return presetsClient.list("assembly", { component: [componentName] });
}

export function variantsOf(
  outfitName: string,
  componentName: string,
): Promise<readonly VariantSummary[]> {
  return variantsOfOutfit(presetsClient, outfitName, componentName);
}

export function outfitsOf() {
  return presetsClient.list("outfit");
}

export function contentOf(componentName: string) {
  return presetsClient.list("content", { component: [componentName] });
}

export function tagsOf() {
  return presetsClient.list("tag");
}
