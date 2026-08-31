// Design notes: ./README.md#types

import type { FluidReport } from "../fluid/index.js";
import type { Keyframes, Skin, SkinVariables, SlotRecipe } from "../recipe/index.js";

export interface Palette extends SkinVariables {
  readonly name: string;
}

export interface Form {
  readonly name: string;
  readonly component: string;
  readonly recipe: SlotRecipe;
  readonly keyframes?: Keyframes;
}

export interface Outfit {
  readonly name: string;
  readonly palette: string;
  readonly forms: readonly string[];
  readonly overrides?: Readonly<Record<string, Readonly<Record<string, string>>>>;
}

export interface LookParts {
  readonly palettes: readonly Palette[];
  readonly forms: readonly Form[];
}

export type OutfitFlawName =
  | "unknown-palette"
  | "unknown-form"
  | "unknown-component"
  | "outside-vocabulary"
  | "palette-incomplete"
  | "component-twice"
  | "variable-elsewhere";

export interface OutfitFlaw {
  readonly name: OutfitFlawName;
  readonly where: string;
  readonly means: string;
}

export interface OutfitReport {
  readonly palette: string;
  readonly dressed: readonly string[];
  readonly overrides: number;
  readonly overridesBy: Readonly<Record<string, number>>;
  readonly fluid: readonly FluidReport[];
}

export interface Assembled {
  readonly skin: Skin;
  readonly report: OutfitReport;
}
