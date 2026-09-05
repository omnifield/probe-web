import { NAMED_COLORS } from "./named.js";
import { type Oklch, srgbToOklch } from "./oklch.js";

export type ColorRefusal = "unknown-notation" | "translucent";

export type ParsedColor =
  | { readonly ok: true; readonly color: Oklch }
  | { readonly ok: false; readonly refusal: ColorRefusal; readonly means: string };

const ANGLE: Readonly<Record<string, number>> = {
  "": 1,
  deg: 1,
  grad: 0.9,
  rad: 180 / Math.PI,
  turn: 360,
};

const clamp = (value: number, low: number, high: number): number =>
  Math.min(high, Math.max(low, value));

function number(raw: string, scale: number, bare = 1): number | undefined {
  const text = raw.trim().toLowerCase();
  if (text === "none") return 0;

  const percent = text.endsWith("%");
  const value = Number.parseFloat(percent ? text.slice(0, -1) : text);
  if (!Number.isFinite(value)) return undefined;

  return percent ? (value / 100) * scale : value * bare;
}

function angle(raw: string): number | undefined {
  const text = raw.trim().toLowerCase();
  if (text === "none") return 0;

  const match = /^(-?[\d.]+(?:e[-+]?\d+)?)(deg|grad|rad|turn)?$/.exec(text);
  if (!match) return undefined;

  const value = Number.parseFloat(match[1]);
  if (!Number.isFinite(value)) return undefined;

  return (((value * ANGLE[match[2] ?? ""]) % 360) + 360) % 360;
}

function split(inside: string, expected: number): { parts: string[]; alpha?: string } | undefined {
  const legacy = inside.includes(",");

  if (legacy) {
    const parts = inside.split(",").map((piece) => piece.trim());
    if (parts.length === expected) return { parts };
    if (parts.length === expected + 1) return { parts: parts.slice(0, expected), alpha: parts[expected] };
    return undefined;
  }

  const [head, ...rest] = inside.split("/");
  if (rest.length > 1) return undefined;

  const parts = head.trim().split(/\s+/).filter(Boolean);
  if (parts.length !== expected) return undefined;

  const alpha = rest.length === 1 ? rest[0].trim() : undefined;
  return alpha === undefined ? { parts } : { parts, alpha };
}

interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const channel = (n: number): number => {
    const k = (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return { r: channel(0), g: channel(8), b: channel(4) };
}

function hwbToRgb(h: number, w: number, b: number): { r: number; g: number; b: number } {
  if (w + b >= 1) {
    const grey = w / (w + b);
    return { r: grey, g: grey, b: grey };
  }

  const pure = hslToRgb(h, 1, 0.5);
  const mix = (value: number): number => value * (1 - w - b) + w;
  return { r: mix(pure.r), g: mix(pure.g), b: mix(pure.b) };
}

function fromHex(raw: string): Rgba | undefined {
  const match = /^#([0-9a-f]{3,8})$/i.exec(raw);
  if (!match) return undefined;

  const digits = match[1];
  if (![3, 4, 6, 8].includes(digits.length)) return undefined;

  const short = digits.length <= 4;
  const pairs = short ? [...digits].map((digit) => digit + digit) : (digits.match(/../g) as string[]);
  const [r, g, b, a = "ff"] = pairs;
  const value = (pair: string): number => Number.parseInt(pair, 16) / 255;

  return { r: value(r), g: value(g), b: value(b), a: value(a) };
}

function alphaOf(raw: string | undefined): number | undefined {
  if (raw === undefined) return 1;
  const value = number(raw, 1);
  return value === undefined ? undefined : clamp(value, 0, 1);
}

const FUNCTIONS: Readonly<Record<string, number>> = {
  rgb: 3,
  rgba: 3,
  hsl: 3,
  hsla: 3,
  hwb: 3,
  oklab: 3,
  oklch: 3,
};

function fromFunction(name: string, parts: string[], alpha: number): Rgba | undefined {
  if (name === "rgb" || name === "rgba") {
    const channels = parts.map((piece) => number(piece, 255));
    if (channels.some((value) => value === undefined)) return undefined;
    const [r, g, b] = channels as number[];
    return { r: clamp(r / 255, 0, 1), g: clamp(g / 255, 0, 1), b: clamp(b / 255, 0, 1), a: alpha };
  }

  const hue = angle(parts[0]);
  if (hue === undefined) return undefined;

  const first = number(parts[1], 1, 0.01);
  const second = number(parts[2], 1, 0.01);
  if (first === undefined || second === undefined) return undefined;

  const rgb =
    name === "hwb"
      ? hwbToRgb(hue, clamp(first, 0, 1), clamp(second, 0, 1))
      : hslToRgb(hue, clamp(first, 0, 1), clamp(second, 0, 1));

  return { r: clamp(rgb.r, 0, 1), g: clamp(rgb.g, 0, 1), b: clamp(rgb.b, 0, 1), a: alpha };
}

function refuse(refusal: ColorRefusal, means: string): ParsedColor {
  return { ok: false, refusal, means };
}

export function tryParseColor(value: string): ParsedColor {
  const raw = value.trim();
  const lower = raw.toLowerCase();

  if (lower === "transparent") {
    return refuse(
      "translucent",
      "цвет «transparent» полностью прозрачен: что под ним — значение не говорит, " +
        "и контраст на нём не считается",
    );
  }

  const named = NAMED_COLORS[lower];
  const hex = fromHex(named ?? raw);

  if (hex) {
    return hex.a < 1
      ? refuse(
          "translucent",
          `цвет «${value}» полупрозрачен (прозрачность ${hex.a}): контраст на нём зависит от того, ` +
            "что под ним, — назовите непрозрачное значение",
        )
      : { ok: true, color: srgbToOklch(hex) };
  }

  const call = /^([a-z]+)\(([\s\S]*)\)$/.exec(lower);
  if (!call) {
    return refuse(
      "unknown-notation",
      `цвет «${value}» не разобран: ожидается oklch/oklab/rgb/hsl/hwb, ` +
        "шестнадцатеричная запись или именованный цвет CSS",
    );
  }

  const [, name, inside] = call;
  const arity = FUNCTIONS[name];
  if (arity === undefined) {
    return refuse(
      "unknown-notation",
      `запись «${name}()» разбору неизвестна: ${
        name === "lab" || name === "lch" || name === "color"
          ? "другое цветовое пространство, здесь не поддержано"
          : "вычисляемые записи (color-mix, light-dark, относительная форма) разбором не считаются"
      }`,
    );
  }

  const pieces = split(inside, arity);
  if (!pieces) {
    return refuse("unknown-notation", `в «${value}» не ${arity} компоненты — запись не разобрана`);
  }

  const alpha = alphaOf(pieces.alpha);
  if (alpha === undefined) {
    return refuse("unknown-notation", `прозрачность в «${value}» не прочитана`);
  }
  if (alpha < 1) {
    return refuse(
      "translucent",
      `цвет «${value}» полупрозрачен (прозрачность ${alpha}): контраст на нём зависит от того, ` +
        "что под ним, — назовите непрозрачное значение",
    );
  }

  if (name === "oklch" || name === "oklab") {
    const l = number(pieces.parts[0], 1);
    if (l === undefined) return refuse("unknown-notation", `светлота в «${value}» не прочитана`);

    if (name === "oklch") {
      const c = number(pieces.parts[1], 0.4);
      const h = angle(pieces.parts[2]);
      if (c === undefined || h === undefined) {
        return refuse("unknown-notation", `цветность или тон в «${value}» не прочитаны`);
      }
      return { ok: true, color: { l, c, h } };
    }

    const a = number(pieces.parts[1], 0.4);
    const b = number(pieces.parts[2], 0.4);
    if (a === undefined || b === undefined) {
      return refuse("unknown-notation", `оси a/b в «${value}» не прочитаны`);
    }
    const c = Math.hypot(a, b);
    return { ok: true, color: { l, c, h: c < 1e-6 ? 0 : ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360 } };
  }

  const rgb = fromFunction(name, pieces.parts, alpha);
  if (!rgb) return refuse("unknown-notation", `компоненты в «${value}» не прочитаны`);

  return { ok: true, color: srgbToOklch(rgb) };
}

export function parseColor(value: string): Oklch {
  const parsed = tryParseColor(value);
  if (parsed.ok) return parsed.color;
  throw new TypeError(parsed.means);
}
