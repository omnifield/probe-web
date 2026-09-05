import type { Srgb } from "./oklch.js";

export interface Veil {
  color: Srgb;
  alpha: number;
}

const CHANNELS = ["r", "g", "b"] as const;

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

const ceilAlpha = (value: number): number => Math.min(1, Math.ceil(value * 1000) / 1000);

export function veilOver(target: Srgb, background: Srgb, minAlpha = 0.008): Veil {
  let alpha = minAlpha;
  for (const channel of CHANNELS) {
    const t = target[channel];
    const b = background[channel];
    if (b > 0) alpha = Math.max(alpha, (b - t) / b);
    if (b < 1) alpha = Math.max(alpha, (t - b) / (1 - b));
  }

  alpha = ceilAlpha(clamp01(alpha));

  const color = {} as Srgb;
  for (const channel of CHANNELS) {
    color[channel] = clamp01(
      (target[channel] - background[channel] * (1 - alpha)) / alpha,
    );
  }

  return { color, alpha };
}

export function composite(veil: Veil, background: Srgb): Srgb {
  const out = {} as Srgb;
  for (const channel of CHANNELS) {
    out[channel] = clamp01(
      veil.color[channel] * veil.alpha + background[channel] * (1 - veil.alpha),
    );
  }
  return out;
}
