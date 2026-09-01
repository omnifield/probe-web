// Design notes: ./README.md#groups

export const GROUPS = {
  actions: "Actions",
  inputs: "Inputs",
  navigation: "Navigation",
  overlays: "Overlays",
  disclosure: "Disclosure",
  iteration: "Iteration",
  feedback: "Feedback",
  layout: "Layout",
  other: "Other",
} as const satisfies Readonly<Record<string, string>>;

export type ComponentGroup = keyof typeof GROUPS;

const DEFAULT_GROUP: ComponentGroup = "other";

export function groupOf(info: { readonly group?: ComponentGroup }): ComponentGroup {
  return info.group ?? DEFAULT_GROUP;
}

export type ComponentFootprint = "compact" | "regular" | "wide";

const DEFAULT_FOOTPRINT: ComponentFootprint = "regular";

export function footprintOf(info: { readonly footprint?: ComponentFootprint }): ComponentFootprint {
  return info.footprint ?? DEFAULT_FOOTPRINT;
}
