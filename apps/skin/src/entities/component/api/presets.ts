import { defineQuery } from "@web-core/query";
import { presetsClient, queryClient } from "#/shared/api/clients";
import { variantsOf as variantsOfOutfit } from "@web-core/skin/presets";

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

export const contentQuery = defineQuery(
  queryClient,
  (componentName: string) => ["content", componentName],
  (componentName: string) =>
    presetsClient.list("content", { component: [componentName] }),
  { staleTime: Infinity },
);

export function tagsOf() {
  return presetsClient.list("tag");
}
