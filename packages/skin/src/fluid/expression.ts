// Design notes: ./README.md#expression

import { measure, pixels, PX_IN_REM } from "./measure.js";
import type { FluidSeed } from "./seed.js";

function formatNumber(amount: number): string {
  return String(Number(amount.toFixed(4)));
}

export function fluidExpression(seed: FluidSeed): string {
  const low = measure(seed.narrow)!;
  const high = measure(seed.wide)!;
  const narrowWidth = measure(seed.between[0])!;
  const wideWidth = measure(seed.between[1])!;

  const lowPx = pixels(low.amount, low.unit);
  const highPx = pixels(high.amount, high.unit);

  const slope = (highPx - lowPx) / (wideWidth.amount - narrowWidth.amount);
  const interceptPx = lowPx - slope * narrowWidth.amount;
  const intercept = low.unit === "rem" ? interceptPx / PX_IN_REM : interceptPx;

  return `clamp(${seed.narrow}, ${formatNumber(intercept)}${low.unit} + ${formatNumber(slope * 100)}vw, ${seed.wide})`;
}
