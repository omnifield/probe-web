import type { ComponentAssembly, Form, Outfit, Palette } from "../../engine/look/index.js";

export const PRESET_KIND = {
  palette: "palette",
  form: "form",
  outfit: "outfit",
  assembly: "assembly",
  content: "content",
  tag: "tag",
} as const;

export type PresetKind = (typeof PRESET_KIND)[keyof typeof PRESET_KIND];

export interface ContentState {
  readonly component: string;
  readonly data: unknown;
  readonly author?: string;
}

export interface Tag {
  readonly name: string;
  readonly label?: string;
  readonly author?: string;
}

export interface PresetKindState {
  palette: Palette;
  form: Form;
  outfit: Outfit;
  assembly: ComponentAssembly;
  content: ContentState;
  tag: Tag;
}
