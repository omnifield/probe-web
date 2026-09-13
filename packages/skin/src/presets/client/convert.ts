import type { PresetKind, PresetKindState } from "./kinds.js";
import type { PresetRecord } from "./record.js";
import type { WirePreset } from "./wire-preset.js";

export function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function toState<T>(kind: PresetKind, item: WirePreset): T {
  if (kind === "outfit") {
    return {
      palette: text(item.palette?.name),
      forms: (item.forms ?? []).map((form) => text(form.name)),
      tags: (item.tags ?? []).map((tag) => text(tag.name)),
      overrides: item.overrides,
      author: item.author,
    } as T;
  }

  if (kind === "palette") {
    return {
      scales: item.scales,
      dimensions: item.dimensions,
      light: item.light,
      dark: item.dark,
      author: item.author,
    } as T;
  }

  if (kind === "form") {
    return {
      component: item.component,
      recipe: item.recipe,
      keyframes: item.keyframes,
      variantTags: item.variantTags,
      author: item.author,
    } as T;
  }

  if (kind === "assembly") {
    return { component: item.component, assembly: item.assembly, author: item.author } as T;
  }

  if (kind === "tag") {
    return { label: item.tagLabel, author: item.author } as T;
  }

  return { component: item.component, data: item.data, author: item.author } as T;
}

export function toRecord<K extends PresetKind>(kind: K, item: WirePreset): PresetRecord<PresetKindState[K]> {
  const name = text(item.name);
  return {
    id: text(item.id),
    label: text(item.label) === "" ? name : text(item.label),
    name,
    kind: text(item.kind) as PresetKind,
    savedAt: text(item.savedAt),
    state: { name, ...toState<PresetKindState[K]>(kind, item) },
  };
}
