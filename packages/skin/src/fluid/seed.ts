// Design notes: ./README.md#seed

export interface FluidSeed {
  readonly narrow: string;
  readonly wide: string;
  readonly between: readonly [string, string];
}

export type DimensionSeed = string | FluidSeed;

export function isFluid(seed: DimensionSeed): seed is FluidSeed {
  return typeof seed === "object";
}
