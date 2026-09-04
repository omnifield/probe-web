export interface Oklch {
  l: number;
  c: number;
  h: number;
}

export interface Srgb {
  r: number;
  g: number;
  b: number;
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

function encodeSrgb(value: number): number {
  const sign = value < 0 ? -1 : 1;
  const abs = Math.abs(value);
  return abs <= 0.0031308 ? 12.92 * value : sign * (1.055 * abs ** (1 / 2.4) - 0.055);
}

function decodeSrgb(value: number): number {
  const sign = value < 0 ? -1 : 1;
  const abs = Math.abs(value);
  return abs <= 0.04045 ? value / 12.92 : sign * ((abs + 0.055) / 1.055) ** 2.4;
}

function oklchToLinear(color: Oklch): [number, number, number] {
  const hueRad = (color.h * Math.PI) / 180;
  const a = color.c * Math.cos(hueRad);
  const b = color.c * Math.sin(hueRad);

  const lCone = (color.l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mCone = (color.l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const sCone = (color.l - 0.0894841775 * a - 1.291485548 * b) ** 3;

  return [
    4.0767416621 * lCone - 3.3077115913 * mCone + 0.2309699292 * sCone,
    -1.2684380046 * lCone + 2.6097574011 * mCone - 0.3413193965 * sCone,
    -0.0041960863 * lCone - 0.7034186147 * mCone + 1.707614701 * sCone,
  ];
}

function linearToOklch(rgb: [number, number, number]): Oklch {
  const [r, g, b] = rgb;

  const lCone = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const mCone = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const sCone = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const l = 0.2104542553 * lCone + 0.793617785 * mCone - 0.0040720468 * sCone;
  const aAxis = 1.9779984951 * lCone - 2.428592205 * mCone + 0.4505937099 * sCone;
  const bAxis = 0.0259040371 * lCone + 0.7827717662 * mCone - 0.808675766 * sCone;

  const c = Math.hypot(aAxis, bAxis);
  const h = c < 1e-6 ? 0 : ((Math.atan2(bAxis, aAxis) * 180) / Math.PI + 360) % 360;

  return { l, c, h };
}

export function inSrgbGamut(color: Oklch): boolean {
  const eps = 1e-5;
  return oklchToLinear(color).every((value) => value >= -eps && value <= 1 + eps);
}

export function toSrgbGamut(color: Oklch): Oklch {
  if (inSrgbGamut(color)) return color;

  let low = 0;
  let high = color.c;
  for (let i = 0; i < 24; i += 1) {
    const mid = (low + high) / 2;
    if (inSrgbGamut({ ...color, c: mid })) low = mid;
    else high = mid;
  }
  return { ...color, c: low };
}

export function oklchToSrgb(color: Oklch): Srgb {
  const [r, g, b] = oklchToLinear(toSrgbGamut(color));
  return { r: clamp01(encodeSrgb(r)), g: clamp01(encodeSrgb(g)), b: clamp01(encodeSrgb(b)) };
}

export function srgbToOklch(color: Srgb): Oklch {
  return linearToOklch([decodeSrgb(color.r), decodeSrgb(color.g), decodeSrgb(color.b)]);
}

const round = (value: number, digits: number): number => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

export function formatOklch(color: Oklch, alpha?: number): string {
  const mapped = toSrgbGamut(color);

  let c = round(mapped.c, 4);
  while (c > 0 && !inSrgbGamut({ ...mapped, l: round(mapped.l, 4), c })) c = round(c - 1e-4, 4);
  const h = c === 0 ? 0 : round(mapped.h, 2);
  const opacity = alpha === undefined || alpha >= 1 ? "" : ` / ${round(alpha, 3)}`;
  return `oklch(${round(mapped.l, 4)} ${c} ${h}${opacity})`;
}

