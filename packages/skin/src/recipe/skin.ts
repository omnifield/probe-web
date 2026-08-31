// Design notes: ./README.md#skin

import type { Keyframes } from "./keyframes.js";
import type { SlotRecipe } from "./slot.js";
import type { SkinVariables } from "./variables.js";

export interface Skin {
  readonly name: string;
  readonly variables?: SkinVariables;
  readonly recipes: Readonly<Record<string, SlotRecipe>>;
  readonly keyframes?: Keyframes;
  readonly overrides?: Readonly<Record<string, Readonly<Record<string, string>>>>;
}
