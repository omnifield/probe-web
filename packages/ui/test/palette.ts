// ПАЛИТРА-ПРОБА (`PWEB-111`) — не поставка, общая фикстура для рецептов-доказательств
// (`src/*/*.recipe.ts`). Живёт в `test/`, а не в `src/`, — она не о компоненте, она о том, чем
// его красят, когда доказывают, что паспорт МОЖНО одеть.
//
// Перенесена построчно из `packages/skin-reference/src/variables.ts` (git-история цела на
// `git show 5d560ae:packages/skin-reference/src/variables.ts`), с тем же доводом, что и рецепты:
// значения общие/механические (семена шкал, ступени), не продуктовый вкус, и пересеваемость —
// то же свойство механики скина, которое доказывают рецепты.
//
// Семенами, а не лестницами: обе половины (светлая/тёмная) строит механика значений — ступени
// назначены, контраст обещан построением, а не подобран.

import type { Palette } from "@omnifield/probe-web-skin/model";

const ДВИЖЕНИЕ: Readonly<Record<string, string>> = {
  "motion-instant": "75ms",
  "motion-fast": "200ms",
  "motion-normal": "320ms",
  "motion-slow": "400ms",

  "ease-linear": "linear",
  "ease-in": "cubic-bezier(0.4, 0, 1, 1)",
  "ease-out": "cubic-bezier(0, 0, 0.2, 1)",
  "ease-in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
};

const ТИПОГРАФИКА: Readonly<Record<string, string>> = {
  "leading-none": "1",
  "leading-tight": "1.25",
  "leading-snug": "1.375",
  "leading-normal": "1.5",
  "leading-relaxed": "1.625",

  "weight-normal": "400",
  "weight-medium": "500",
  "weight-semibold": "600",
  "weight-bold": "700",
};

/** Палитра-проба — пять цветных шкал по назначению, а не по цвету, и восемь размерных семян. */
export const palette: Palette = {
  name: "проба",
  scales: {
    акцент: "oklch(0.55 0.18 255)",
    нейтраль: "oklch(0.55 0.02 255)",
    опасность: "oklch(0.55 0.2 25)",
    успех: "oklch(0.55 0.15 145)",
    предупреждение: "oklch(0.7 0.15 75)",
  },

  dimensions: {
    density: "1",
    radius: "0.5rem",
    space: { narrow: "0.375rem", wide: "0.5rem", between: ["366px", "1200px"] },
    "font-size": { narrow: "0.9375rem", wide: "1rem", between: ["366px", "1200px"] },
    column: "0.5rem",
    "control-height": "2.5rem",
    "border-width": "1px",
    tracking: "0em",
  },

  light: { ...ДВИЖЕНИЕ, ...ТИПОГРАФИКА },
};
