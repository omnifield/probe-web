// PROOF RECIPE (`PWEB-111`) — not a shipped product, not product taste. Lives next to the
// component, but is NEVER exported from `index.ts`/`passport.ts`/`kit.ts` — only proves the
// passport CAN be dressed whole by the real skin mechanism (`skinGaps` empty, CSS is generated).
// Same physical shape as every other component's `playground/recipe.ts` (`PWEB-127`).
//
// SAME MACHINE AS THE RADIO GROUP (`../entity/anatomy.ts`), a DIFFERENT LOOK on purpose: a
// segmented-control track-and-sliding-pill (the toggle group's own visual family), not a row of
// separate circles. `indicator` fills the chosen item's own measured box exactly (`--left`/
// `--top`/`--width`/`--height`) — unlike the radio group's own small centered dot, here the pill
// IS the item's full background, the same "indicator as the selection surface" shape the tabs'
// own `pills` variant already uses.

import type { Form, SlotRecipe } from "@omnifield/probe-web-skin/model";

const transition = "background-color var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out)";
const slide = "left var(--motion-normal) var(--ease-out), top var(--motion-normal) var(--ease-out), width var(--motion-normal) var(--ease-out), height var(--motion-normal) var(--ease-out)";

export const recipe: SlotRecipe = {
  base: {
    root: {
      props: {
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-1)",
        padding: "var(--space-1)",
        borderRadius: "var(--radius-lg)",
        background: "var(--neutral-3)",
      },
      states: { disabled: { props: { opacity: "0.6" } } },
    },
    label: {
      props: {
        paddingInline: "var(--space-2)",
        fontSize: "var(--font-size-sm)",
        fontWeight: "var(--weight-medium)",
        color: "var(--neutral-11)",
      },
    },
    item: {
      props: {
        position: "relative",
        display: "inline-flex",
        cursor: "pointer",
      },
      states: {
        disabled: { props: { cursor: "not-allowed" } },
      },
    },
    itemControl: {
      props: {
        position: "absolute",
        inset: "0",
        borderRadius: "var(--radius-md)",
        transition,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        hover: { props: { background: "var(--neutral-4)" } },
        active: { props: { background: "var(--neutral-5)" } },
        "focus-visible": {
          props: {
            outline: "var(--border-width-2) solid var(--accent-8)",
            outlineOffset: "var(--border-width-2)",
          },
        },
      },
    },
    itemText: {
      props: {
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minBlockSize: "var(--control-height-sm)",
        paddingInline: "var(--space-3)",
        fontSize: "var(--font-size-sm)",
        fontWeight: "var(--weight-medium)",
        color: "var(--neutral-11)",
        pointerEvents: "none",
        transition,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        checked: { props: { color: "var(--neutral-12)" } },
        disabled: { props: { color: "var(--neutral-8)" } },
      },
    },
    // Fills the chosen item's own box exactly — see the file header.
    indicator: {
      props: {
        position: "absolute",
        left: "var(--left)",
        top: "var(--top)",
        width: "var(--width)",
        height: "var(--height)",
        background: "var(--neutral-1)",
        borderRadius: "var(--radius-md)",
        boxShadow: "0 1px 2px oklch(0% 0 0 / 0.16)",
        transition: slide,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        disabled: { props: { boxShadow: "none" } },
      },
    },
  },
  settings: {
    orientation: {
      horizontal: {},
      vertical: {
        root: { props: { flexDirection: "column", alignItems: "stretch" } },
      },
    },
  },
};

/** Form — the "name + component + recipe" record `assemble` accepts. */
export const form: Form = { name: "segment-group-sample", component: "segment-group", recipe };
