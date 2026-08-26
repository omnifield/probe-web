// SAMPLE PALETTE (`PWEB-111`) — not a shipped product, a shared fixture for proof recipes
// (`src/*/*.recipe.ts`). Lives in `test/`, not `src/` — it is not about a component, it is about
// what dresses one when proving a passport CAN be dressed.
//
// Ported line-for-line from `packages/skin-reference/src/variables.ts` (git history is intact at
// `git show 5d560ae:packages/skin-reference/src/variables.ts`), for the same reason as the
// recipes: the values are shared/mechanical (scale seeds, steps), not product taste, and
// re-seedability is the same property of the skin mechanism the recipes prove.
//
// Seeds, not ladders: both halves (light/dark) are built by the values mechanism — steps are
// assigned and contrast is promised by construction, not picked by eye.

import type { Palette } from "@omnifield/probe-web-skin/model";

const MOTION: Readonly<Record<string, string>> = {
  "motion-instant": "75ms",
  "motion-fast": "200ms",
  "motion-normal": "320ms",
  "motion-slow": "400ms",

  "ease-linear": "linear",
  "ease-in": "cubic-bezier(0.4, 0, 1, 1)",
  "ease-out": "cubic-bezier(0, 0, 0.2, 1)",
  "ease-in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
};

const TYPOGRAPHY: Readonly<Record<string, string>> = {
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

/** Sample palette — five color scales named by purpose, not by hue, and eight dimension seeds. */
export const palette: Palette = {
  name: "sample",
  scales: {
    accent: "oklch(0.55 0.18 255)",
    neutral: "oklch(0.55 0.02 255)",
    danger: "oklch(0.55 0.2 25)",
    success: "oklch(0.55 0.15 145)",
    warning: "oklch(0.7 0.15 75)",
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

  light: { ...MOTION, ...TYPOGRAPHY },
};
