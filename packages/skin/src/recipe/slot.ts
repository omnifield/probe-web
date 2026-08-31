// Design notes: ./README.md#slot

import type { PartStyles } from "./local.js";

export interface CompoundVariant<Part extends string = string> {
  readonly variants?: readonly string[];
  readonly states?: readonly string[];
  readonly style: PartStyles<Part>;
}

export interface SlotRecipe<Part extends string = string> {
  readonly base?: PartStyles<Part>;
  readonly variants?: Readonly<Record<string, PartStyles<Part>>>;
  readonly defaultVariant?: string;
  readonly settings?: Readonly<Record<string, Readonly<Record<string, PartStyles<Part>>>>>;
  readonly compoundVariants?: readonly CompoundVariant<Part>[];
}
