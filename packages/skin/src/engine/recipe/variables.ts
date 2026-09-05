
import type { DimensionSeed } from "../fluid/index.js";

export interface SeededScale {
  readonly seed: string;
  readonly alpha?: boolean;
  readonly chart?: boolean;
  readonly scrim?: boolean;
}

export type ScaleDeclaration = string | SeededScale;

export interface SkinVariables {
  readonly scales?: Readonly<Record<string, ScaleDeclaration>>;
  readonly dimensions?: Readonly<Record<string, DimensionSeed>>;
  readonly light?: Readonly<Record<string, string>>;
  readonly dark?: Readonly<Record<string, string>>;
}
