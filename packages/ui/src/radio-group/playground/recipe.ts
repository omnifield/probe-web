// PROOF RECIPE (`PWEB-111`) — not a shipped product, not product taste. Lives next to the
// component, but is NEVER exported from `index.ts`/`passport.ts`/`kit.ts` — only proves the
// passport CAN be dressed whole by the real skin mechanism (`skinGaps` empty, CSS is generated).
// Same physical shape as every other component's `playground/recipe.ts` (`PWEB-127`).
//
// Six parts, two state dictionaries (`../entity/passport.ts`). The control+ring look is the
// checkbox's own nearest sibling (`checkbox/playground/recipe.ts`); the sliding-dot mechanics are
// the tabs' own (`--left`/`--top`/`--width`/`--height`), CONFIRMED against Ark's own documented
// anatomy (`ark-ui` MCP, 2026-08-26) to be a single indicator anchored to `root`, not one embedded
// per item — hence `root` carries `position: relative` and `indicator` is sized/positioned as a
// small dot centered over whichever item's circle is currently measured, not the tabs' own
// full-width bar.

import type { Form, SlotRecipe } from "@omnifield/probe-web-skin/model";

const ringTransition = "background-color var(--motion-fast) var(--ease-out), border-color var(--motion-fast) var(--ease-out)";
const dotTransition = "left var(--motion-normal) var(--ease-out), top var(--motion-normal) var(--ease-out)";
const dotSize = "0.5rem";

export const recipe: SlotRecipe = {
  base: {
    root: {
      props: {
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-2)",
      },
      states: {
        disabled: { props: { opacity: "0.5" } },
      },
    },
    label: {
      props: {
        fontSize: "var(--font-size-md)",
        fontWeight: "var(--weight-medium)",
        color: "var(--neutral-12)",
      },
      states: {
        disabled: { props: { color: "var(--neutral-11)" } },
      },
    },
    item: {
      props: {
        display: "flex",
        alignItems: "center",
        gap: "var(--space-2)",
        cursor: "pointer",
      },
      states: {
        disabled: { props: { cursor: "not-allowed" } },
      },
    },
    itemControl: {
      props: {
        display: "inline-flex",
        boxSizing: "border-box",
        flexShrink: "0",
        width: "var(--control-height-sm)",
        height: "var(--control-height-sm)",
        borderRadius: "var(--radius-full)",
        borderWidth: "var(--border-width-1)",
        borderStyle: "solid",
        borderColor: "var(--neutral-7)",
        background: "var(--neutral-1)",
        transition: ringTransition,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        checked: { props: { borderColor: "var(--accent-9)" } },
        hover: { props: { borderColor: "var(--accent-8)" } },
        "focus-visible": {
          props: {
            outline: "var(--border-width-2) solid var(--accent-8)",
            outlineOffset: "var(--space-1)",
          },
        },
        invalid: { props: { borderColor: "var(--danger-9)" } },
        disabled: { props: { borderColor: "var(--neutral-6)", background: "var(--neutral-3)" } },
      },
    },
    itemText: {
      props: {
        fontSize: "var(--font-size-md)",
        color: "var(--neutral-12)",
      },
      states: {
        disabled: { props: { color: "var(--neutral-11)" } },
      },
    },
    // A small dot centered over whichever item's ring is currently measured — NOT the tabs' own
    // full-box bar: `--width`/`--height` here are the RING's size, and the dot only needs to sit
    // in its middle, not fill it.
    indicator: {
      props: {
        position: "absolute",
        left: "calc(var(--left) + (var(--width) - " + dotSize + ") / 2)",
        top: "calc(var(--top) + (var(--height) - " + dotSize + ") / 2)",
        width: dotSize,
        height: dotSize,
        borderRadius: "var(--radius-full)",
        background: "var(--accent-9)",
        pointerEvents: "none",
        transition: dotTransition,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        disabled: { props: { background: "var(--neutral-6)" } },
      },
    },
  },
  settings: {
    orientation: {
      horizontal: {
        root: { props: { flexDirection: "row" } },
      },
    },
  },
};

/** Form — the "name + component + recipe" record `assemble` accepts. */
export const form: Form = { name: "radio-group-sample", component: "radio-group", recipe };
