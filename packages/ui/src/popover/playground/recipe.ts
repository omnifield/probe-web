// PROOF RECIPE (`PWEB-111`) — not a shipped product, not product taste. Lives next to the
// component, but is NEVER exported from `index.ts`/`passport.ts`/`kit.ts` — only proves the
// passport CAN be dressed whole by the real skin mechanism (`skinGaps` empty, CSS is generated).
// Same physical shape as every other component's `playground/recipe.ts` (`PWEB-127`).
//
// `positioner` reads `--available-width`/`--available-height` (its own measured variables,
// `../entity/passport.ts`), the same pattern the select's/date picker's own positioner already
// stands on.

import type { Form, SlotRecipe } from "@omnifield/probe-web-skin/model";

const transition = "background-color var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out)";

const buttonStates = {
  hover: { props: { background: "var(--neutral-4)" } },
  active: { props: { background: "var(--neutral-5)" } },
  "focus-visible": {
    props: {
      outline: "var(--border-width-2) solid var(--accent-8)",
      outlineOffset: "var(--border-width-2)",
    },
  },
} as const;

export const recipe: SlotRecipe = {
  base: {
    trigger: {
      props: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minBlockSize: "var(--control-height-md)",
        paddingInline: "var(--space-4)",
        borderWidth: "0",
        borderRadius: "var(--radius-md)",
        background: "var(--neutral-3)",
        color: "var(--neutral-12)",
        fontSize: "var(--font-size-md)",
        cursor: "pointer",
        transition,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: { ...buttonStates, open: { props: { background: "var(--neutral-4)" } } },
    },
    indicator: {
      props: {
        display: "inline-flex",
        transition: "transform var(--motion-fast) var(--ease-out)",
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: { open: { props: { transform: "rotate(180deg)" } } },
    },
    anchor: { props: {} },
    positioner: {
      props: {
        maxWidth: "var(--available-width)",
        maxHeight: "var(--available-height)",
      },
    },
    content: {
      props: {
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-2)",
        maxWidth: "20rem",
        padding: "var(--space-4)",
        background: "var(--neutral-1)",
        borderWidth: "var(--border-width-1)",
        borderStyle: "solid",
        borderColor: "var(--neutral-6)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "0 4px 16px oklch(0% 0 0 / 0.16)",
      },
    },
    title: {
      props: { fontSize: "var(--font-size-md)", fontWeight: "var(--weight-medium)", color: "var(--neutral-12)" },
    },
    description: {
      props: { fontSize: "var(--font-size-sm)", color: "var(--neutral-11)", lineHeight: "var(--leading-relaxed)" },
    },
    closeTrigger: {
      props: {
        position: "absolute",
        top: "var(--space-2)",
        insetInlineEnd: "var(--space-2)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        inlineSize: "1.5rem",
        blockSize: "1.5rem",
        borderWidth: "0",
        borderRadius: "var(--radius-full)",
        background: "transparent",
        color: "var(--neutral-11)",
        cursor: "pointer",
        transition,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        hover: { props: { background: "var(--neutral-4)", color: "var(--neutral-12)" } },
        active: { props: { background: "var(--neutral-5)" } },
        "focus-visible": {
          props: {
            outline: "var(--border-width-2) solid var(--accent-8)",
            outlineOffset: "var(--border-width-2)",
          },
        },
      },
    },
    arrow: { props: {} },
    arrowTip: { props: { background: "var(--neutral-1)" } },
  },
};

/** Form — the "name + component + recipe" record `assemble` accepts. */
export const form: Form = { name: "popover-sample", component: "popover", recipe };
