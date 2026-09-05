import { type Oklch, oklchToSrgb } from "./oklch.js";
import { parseColor } from "./parse.js";

export const AA_TEXT = 4.5;

export const AA_NON_TEXT = 3;

function relativeLuminance(color: Oklch): number {
  const { r, g, b } = oklchToSrgb(color);
  const channel = (value: number): number =>
    value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: Oklch | string, b: Oklch | string): number {
  const first = relativeLuminance(typeof a === "string" ? parseColor(a) : a);
  const second = relativeLuminance(typeof b === "string" ? parseColor(b) : b);
  const [light, dark] = first >= second ? [first, second] : [second, first];
  return (light + 0.05) / (dark + 0.05);
}
