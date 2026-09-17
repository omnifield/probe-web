import { defineQuery } from "@web-core/query";
import { variantsOf as variantsOfOutfit } from "@web-core/skin/presets";
import { presetsClient, queryClient } from "#/shared/api/clients";

export const palettesOf = defineQuery(
  queryClient,
  () => ["palettes"],
  () => presetsClient.list("palette"),
  { staleTime: Infinity },
);

export const assembliesOf = defineQuery(
  queryClient,
  (componentName: string) => ["assemblies", componentName],
  (componentName: string) =>
    presetsClient.list("assembly", { component: [componentName] }),
  { staleTime: Infinity },
);

export const variantsOf = defineQuery(
  queryClient,
  (componentName: string) => ["variants", componentName],
  (componentName: string) => variantsOfOutfit(presetsClient, componentName),
  { staleTime: Infinity },
);

export const outfitsOf = defineQuery(
  queryClient,
  () => ["outfits"],
  () => presetsClient.list("outfit"),
  { staleTime: Infinity },
);

export const contentOf = defineQuery(
  queryClient,
  (componentName: string) => ["content", componentName],
  (componentName: string) =>
    presetsClient.list("content", { component: [componentName] }),
  { staleTime: Infinity },
);

export function tagsOf() {
  return presetsClient.list("tag");
}
