// Design notes: ./README.md#report

import { measure, pixels } from "./measure.js";
import type { FluidSeed } from "./seed.js";

export interface FluidPole {
  readonly value: string;
  readonly px: number;
}

export interface FluidReport {
  readonly seed: string;
  readonly narrow: FluidPole;
  readonly wide: FluidPole;
}

export function fluidPoles(name: string, seed: FluidSeed): FluidReport | null {
  const low = measure(seed.narrow);
  const high = measure(seed.wide);
  if (!low || !high) return null;

  return {
    seed: name,
    narrow: { value: seed.narrow, px: pixels(low.amount, low.unit) },
    wide: { value: seed.wide, px: pixels(high.amount, high.unit) },
  };
}
