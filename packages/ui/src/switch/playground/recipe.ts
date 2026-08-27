// PROOF RECIPE (`PWEB-111`) — not a shipped product, not product taste. Lives next to the
// component, but is NEVER exported from `index.ts`/`passport.ts`/`kit.ts` — only proves the
// passport CAN be dressed whole by the real skin mechanism (`skinGaps` empty, CSS is generated).
// Same physical shape as every other component's `playground/recipe.ts` (`PWEB-127`).
//
// Track-and-thumb: the thumb SLIDES (`transform: translateX`, not a repositioned box) between the
// track's two ends. The travel distance is arithmetic, not measured — unlike the tabs'/radio
// group's own indicators, the switch has exactly two fixed positions, and no kit-measured
// variable exists for either one (`../entity/passport.ts` declares none): track inner width
// (2.5rem outer − 2×0.125rem padding = 2.25rem) minus thumb width (1.25rem) leaves exactly 1rem
// to travel.

import type { Form, SlotRecipe } from "@omnifield/probe-web-skin/model";

const trackTransition = "background-color var(--motion-fast) var(--ease-out)";
const thumbTransition = "transform var(--motion-fast) var(--ease-out)";

export const recipe: SlotRecipe = {
  base: {
    root: {
      props: {
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-2)",
        cursor: "pointer",
      },
      states: {
        disabled: { props: { cursor: "not-allowed", opacity: "0.5" } },
      },
    },
    control: {
      props: {
        boxSizing: "border-box",
        display: "inline-flex",
        alignItems: "center",
        width: "2.5rem",
        height: "1.5rem",
        padding: "0.125rem",
        borderRadius: "var(--radius-full)",
        background: "var(--neutral-6)",
        transition: trackTransition,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        checked: { props: { background: "var(--accent-9)" } },
        hover: { props: { background: "var(--neutral-7)" } },
        "focus-visible": {
          props: {
            outline: "var(--border-width-2) solid var(--accent-8)",
            outlineOffset: "var(--space-1)",
          },
        },
        invalid: { props: { background: "var(--danger-9)" } },
        disabled: { props: { background: "var(--neutral-4)" } },
      },
    },
    thumb: {
      props: {
        width: "1.25rem",
        height: "1.25rem",
        borderRadius: "var(--radius-full)",
        background: "var(--neutral-1)",
        boxShadow: "0 1px 2px oklch(0% 0 0 / 0.24)",
        transition: thumbTransition,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        checked: { props: { transform: "translateX(1rem)" } },
      },
    },
    label: {
      props: {
        fontSize: "var(--font-size-md)",
        color: "var(--neutral-12)",
      },
      states: {
        disabled: { props: { color: "var(--neutral-11)" } },
      },
    },
  },
};

/** Form — the "name + component + recipe" record `assemble` accepts. */
export const form: Form = { name: "switch-sample", component: "switch", recipe };
