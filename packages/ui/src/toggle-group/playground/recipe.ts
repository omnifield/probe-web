// PROOF RECIPE (`PWEB-111`) — not a shipped product, not product taste. Lives next to the
// component, but is NEVER exported from `index.ts`/`passport.ts`/`kit.ts` — only proves the
// passport CAN be dressed whole by the real skin mechanism (`skinGaps` empty, CSS is generated).
// Same physical shape as every other component's `playground/recipe.ts` (`PWEB-127`).
//
// A segmented control: `root` is the padded track, `item` is a pill that gains its own
// background/shadow only when `on` — the everyday look this pattern ships with everywhere
// (macOS's own segmented control, most component libraries' `ToggleGroup`/`SegmentedControl`).

import type { Form, SlotRecipe } from "@omnifield/probe-web-skin/model";

const transition = "background-color var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out), box-shadow var(--motion-fast) var(--ease-out)";

export const recipe: SlotRecipe = {
  base: {
    root: {
      props: {
        display: "inline-flex",
        gap: "var(--space-1)",
        padding: "var(--space-1)",
        borderRadius: "var(--radius-lg)",
        background: "var(--neutral-3)",
      },
      states: {
        disabled: { props: { opacity: "0.6" } },
      },
    },
    item: {
      props: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--space-2)",
        minHeight: "var(--control-height-sm)",
        paddingInline: "var(--space-3)",
        borderWidth: "0",
        borderRadius: "var(--radius-md)",
        background: "transparent",
        color: "var(--neutral-11)",
        fontSize: "var(--font-size-md)",
        fontWeight: "var(--weight-medium)",
        cursor: "pointer",
        transition,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        on: { props: { background: "var(--neutral-1)", color: "var(--neutral-12)", boxShadow: "0 1px 2px oklch(0% 0 0 / 0.16)" } },
        hover: { props: { color: "var(--neutral-12)" } },
        "focus-visible": {
          props: {
            outline: "var(--border-width-2) solid var(--accent-8)",
            outlineOffset: "calc(var(--border-width-2) * -1)",
          },
        },
        disabled: { props: { cursor: "not-allowed", color: "var(--neutral-8)" } },
      },
    },
  },
  settings: {
    orientation: {
      vertical: {
        root: { props: { flexDirection: "column" } },
      },
    },
  },
};

/** Form — the "name + component + recipe" record `assemble` accepts. */
export const form: Form = { name: "toggle-group-sample", component: "toggle-group", recipe };
