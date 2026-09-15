import { presetsClient, queryClient } from "#/shared/api/clients";
import {
  variantsOf as variantsOfOutfit,
  type VariantSummary,
} from "@web-core/skin/presets";

export function palettesOf() {
  return queryClient.fetchQuery({
    queryKey: ["palettes"],
    queryFn: () => presetsClient.list("palette"),
    staleTime: Infinity,
  });
}

export function assembliesOf(componentName: string) {
  return queryClient.fetchQuery({
    queryKey: ["assemblies", componentName],
    queryFn: () => presetsClient.list("assembly", { component: [componentName] }),
    staleTime: Infinity,
  });
}

export function variantsOf(componentName: string): Promise<readonly VariantSummary[]> {
  return queryClient.fetchQuery({
    queryKey: ["variants", componentName],
    queryFn: () => variantsOfOutfit(presetsClient, componentName),
    staleTime: Infinity,
  });
}

export function outfitsOf() {
  return queryClient.fetchQuery({
    queryKey: ["outfits"],
    queryFn: () => presetsClient.list("outfit"),
    staleTime: Infinity,
  });
}

export function contentOf(componentName: string) {
  return presetsClient.list("content", { component: [componentName] });
}

export function tagsOf() {
  return presetsClient.list("tag");
}
