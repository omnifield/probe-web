import { veilOver } from "./color/alpha.js";
import { AA_NON_TEXT, AA_TEXT, contrastRatio } from "./color/contrast.js";
import { type Oklch, formatOklch, oklchToSrgb, srgbToOklch } from "./color/oklch.js";
import { parseColor } from "./color/parse.js";
import { trace } from "./trace.js";

export type ScaleMode = "light" | "dark";

export const SCALE_STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
export type ScaleStep = (typeof SCALE_STEPS)[number];

export const STEP_PURPOSE: Record<ScaleStep, string> = {
  1: "фон приложения",
  2: "фон приложения, приглушённый",
  3: "фон элемента",
  4: "фон элемента при наведении",
  5: "фон элемента при нажатии",
  6: "тонкая граница и разделитель",
  7: "граница элемента",
  8: "сильная граница и кольцо фокуса",
  9: "сплошной акцент",
  10: "сплошной акцент при наведении",
  11: "текст низкого контраста",
  12: "текст высокого контраста",
};

export type ScaleKey = `${ScaleStep}` | "contrast";

export type StepPurposeClass = "fill" | "ink";

export const STEP_PURPOSE_CLASS: Record<ScaleKey, StepPurposeClass> = {
  "1": "fill",
  "2": "fill",
  "3": "fill",
  "4": "fill",
  "5": "fill",
  "6": "fill",
  "7": "fill",
  "8": "fill",
  "9": "fill",
  "10": "fill",
  "11": "ink",
  "12": "ink",
  contrast: "ink",
};

export type ScaleValues = Record<ScaleKey, string>;

export interface ContrastPromise {
  step: ScaleKey;
  against: ScaleKey[];
  min: number;
  criterion: string;
}

export const CONTRAST_PROMISES: readonly ContrastPromise[] = [
  {
    step: "8",
    against: ["1", "2"],
    min: AA_NON_TEXT,
    criterion: "WCAG 2.2, 1.4.11 Non-text Contrast (AA) — кольцо фокуса и сильная граница",
  },
  {
    step: "11",
    against: ["1", "2", "3"],
    min: AA_TEXT,
    criterion: "WCAG 2.2, 1.4.3 Contrast (Minimum) (AA) — текст низкого контраста",
  },
  {
    step: "12",
    against: ["1", "2", "3", "4", "5"],
    min: AA_TEXT,
    criterion: "WCAG 2.2, 1.4.3 Contrast (Minimum) (AA) — текст высокого контраста",
  },
  {
    step: "contrast",
    against: ["9", "10"],
    min: AA_TEXT,
    criterion: "WCAG 2.2, 1.4.3 Contrast (Minimum) (AA) — подпись на сплошном акценте",
  },
];

export const NO_PROMISE: Record<string, string> = {
  "1-5": "фоны: контраст даёт то, что НА них, а не они сами",
  "6-7": "тонкая граница и разделитель — оформление, не носитель информации (1.4.11 к ним не применяется)",
  "9-10":
    "сплошной акцент: сохраняем верность бренду. 1.4.11 требует контраста от того, что ИДЕНТИФИЦИРУЕТ контрол; у контрола с видимой подписью это подпись — её контраст обещает ступень `contrast`",
  "a1-a12":
    "альфа-ступени: контраст полупрозрачного цвета зависит от того, что под ним, а под ним произвольный фон — обещание здесь не просто не даётся, оно НЕВОЗМОЖНО. Считать контраст обязан тот, кто знает подложку",
};

const BACKDROP_L: Record<ScaleMode, readonly number[]> = {
  light: [0.994, 0.98, 0.964, 0.947, 0.928, 0.904, 0.865],
  dark: [0.175, 0.213, 0.252, 0.285, 0.317, 0.358, 0.415],
};

const TEXT_STRONG_L: Record<ScaleMode, number> = { light: 0.24, dark: 0.955 };

const CHROMA_FACTOR: Record<ScaleKey, number> = {
  "1": 0.04,
  "2": 0.09,
  "3": 0.18,
  "4": 0.24,
  "5": 0.3,
  "6": 0.36,
  "7": 0.44,
  "8": 0.62,
  "9": 1,
  "10": 1,
  "11": 0.72,
  "12": 0.32,
  contrast: 0,
};

const MARGIN = 0.02;

const SOLID_HOVER_SHIFT = 0.045;

const DARK_SOLID_FLOOR = 0.45;

function solveLightness(options: {
  chroma: number;
  hue: number;
  background: string;
  target: number;
  direction: "darker" | "lighter";
}): number {
  const { chroma, hue, background, target, direction } = options;
  const at = (l: number): string => formatOklch({ l, c: chroma, h: hue });
  const passes = (l: number): boolean => contrastRatio(at(l), background) >= target;

  let pass = direction === "darker" ? 0 : 1;
  let fail = parseColor(background).l;

  if (!passes(pass)) return pass;

  for (let i = 0; i < 20; i += 1) {
    const mid = (pass + fail) / 2;
    if (passes(mid)) pass = mid;
    else fail = mid;
  }
  return pass;
}

export function buildScale(seed: string | Oklch, mode: ScaleMode): ScaleValues {
  const done = trace(`buildScale(${mode})`);

  const base = typeof seed === "string" ? parseColor(seed) : seed;
  const chroma = (key: ScaleKey): number => base.c * CHROMA_FACTOR[key];
  const values = {} as ScaleValues;

  BACKDROP_L[mode].forEach((l, index) => {
    const key = `${index + 1}` as ScaleKey;
    values[key] = formatOklch({ l, c: chroma(key), h: base.h });
  });

  const away = mode === "light" ? "darker" : "lighter";

  values["8"] = formatOklch({
    l: solveLightness({
      chroma: chroma("8"),
      hue: base.h,
      background: values["2"],
      target: AA_NON_TEXT + MARGIN,
      direction: away,
    }),
    c: chroma("8"),
    h: base.h,
  });

  const solidL =
    mode === "light"
      ? Math.min(Math.max(base.l, 0.2), 0.85)
      : Math.min(
          Math.max(
            solveLightness({
              chroma: chroma("9"),
              hue: base.h,
              background: values["1"],
              target: contrastRatio(
                formatOklch({ l: base.l, c: base.c, h: base.h }),
                formatOklch({ l: BACKDROP_L.light[0], c: chroma("1"), h: base.h }),
              ),
              direction: "lighter",
            }),
            DARK_SOLID_FLOOR,
          ),
          0.92,
        );

  values["9"] = formatOklch({ l: solidL, c: chroma("9"), h: base.h });

  const light = { l: 0.99, c: Math.min(base.c * 0.04, 0.02), h: base.h };
  const dark = { l: 0.17, c: Math.min(base.c * 0.1, 0.04), h: base.h };
  const better = (a: Oklch, b: Oklch): Oklch =>
    contrastRatio(formatOklch(a), values["9"]) >= contrastRatio(formatOklch(b), values["9"])
      ? a
      : b;

  let ink = better(light, dark);
  if (contrastRatio(formatOklch(ink), values["9"]) < AA_TEXT + MARGIN) {
    ink = better({ l: 1, c: 0, h: 0 }, { l: 0, c: 0, h: 0 });
  }
  values.contrast = formatOklch(ink);

  const inkIsLight = parseColor(values.contrast).l > 0.5;
  let hoverL = solidL + (inkIsLight ? -SOLID_HOVER_SHIFT : SOLID_HOVER_SHIFT);
  if (hoverL < 0.05 || hoverL > 0.97) {
    hoverL = solidL - (inkIsLight ? -SOLID_HOVER_SHIFT : SOLID_HOVER_SHIFT);
  }
  values["10"] = formatOklch({ l: hoverL, c: chroma("10"), h: base.h });

  values["11"] = formatOklch({
    l: solveLightness({
      chroma: chroma("11"),
      hue: base.h,
      background: values["3"],
      target: AA_TEXT + MARGIN,
      direction: away,
    }),
    c: chroma("11"),
    h: base.h,
  });

  values["12"] = formatOklch({
    l: TEXT_STRONG_L[mode],
    c: chroma("12"),
    h: base.h,
  });

  done();
  return values;
}

export const CHART_SLOTS = 5;

export function buildChartScale(seed: string | Oklch, mode: ScaleMode): string[] {
  const base = typeof seed === "string" ? parseColor(seed) : seed;
  const backdrop = formatOklch({
    l: BACKDROP_L[mode][1],
    c: base.c * CHROMA_FACTOR["2"],
    h: base.h,
  });
  const chroma = 0.15;

  return Array.from({ length: CHART_SLOTS }, (_, index) => {
    const hue = (base.h + (360 / CHART_SLOTS) * index) % 360;
    const l = solveLightness({
      chroma,
      hue,
      background: backdrop,
      target: AA_NON_TEXT + MARGIN,
      direction: mode === "light" ? "darker" : "lighter",
    });
    return formatOklch({ l, c: chroma, h: hue });
  });
}

export type AlphaKey = `a${ScaleStep}`;

export type AlphaValues = Record<AlphaKey, string>;

export function buildAlphaScale(seed: string | Oklch, mode: ScaleMode): AlphaValues {
  const solid = buildScale(seed, mode);
  const background = oklchToSrgb(parseColor(solid["1"]));
  const values = {} as AlphaValues;

  for (const step of SCALE_STEPS) {
    const target = oklchToSrgb(parseColor(solid[`${step}` as ScaleKey]));
    const veil = veilOver(target, background);
    values[`a${step}`] = formatOklch(srgbToOklch(veil.color), veil.alpha);
  }

  return values;
}

export function buildScrim(seed: string | Oklch): string {
  const solid = buildScale(seed, "light");
  const { alpha } = veilOver(
    oklchToSrgb(parseColor(solid["9"])),
    oklchToSrgb(parseColor(solid["1"])),
  );
  return formatOklch({ l: 0, c: 0, h: 0 }, alpha);
}
