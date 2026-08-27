// PROOF RECIPE (`PWEB-111`) — not a shipped product, not product taste. Lives next to the
// component, but is NEVER exported from `index.ts`/`passport.ts`/`kit.ts` — only proves the
// passport CAN be dressed whole by the real skin mechanism (`skinGaps` empty, CSS is generated).
// Same physical shape as every other component's `playground/recipe.ts` (`PWEB-127`).
//
// `highlighted` carries the look hover/focus-visible would elsewhere (`../entity/passport.ts`'s
// own file header: items are never individually focusable, `data-highlighted` is the one virtual
// "current item" fact) — no separate hover/focus-visible rules exist on any item-family part.

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

const itemLook = {
  display: "flex",
  alignItems: "center",
  gap: "var(--space-2)",
  paddingInline: "var(--space-3)",
  paddingBlock: "var(--space-2)",
  borderRadius: "var(--radius-md)",
  fontSize: "var(--font-size-md)",
  color: "var(--neutral-12)",
  cursor: "pointer",
  transition,
  "@media (prefers-reduced-motion: reduce)": { transition: "none" },
} as const;

const itemStates = {
  highlighted: { props: { background: "var(--accent-9)", color: "var(--accent-contrast)" } },
  disabled: { props: { opacity: "0.5", cursor: "not-allowed" } },
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
    triggerItem: {
      props: { ...itemLook, justifyContent: "space-between" },
      states: itemStates,
    },
    contextTrigger: { props: {} },
    indicator: {
      props: {
        display: "inline-flex",
        transition: "transform var(--motion-fast) var(--ease-out)",
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: { open: { props: { transform: "rotate(180deg)" } } },
    },
    positioner: {
      props: {
        maxWidth: "var(--available-width)",
        maxHeight: "var(--available-height)",
      },
    },
    content: {
      props: {
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-1)",
        minWidth: "12rem",
        padding: "var(--space-1)",
        background: "var(--neutral-1)",
        borderWidth: "var(--border-width-1)",
        borderStyle: "solid",
        borderColor: "var(--neutral-6)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "0 4px 16px oklch(0% 0 0 / 0.16)",
      },
    },
    arrow: { props: {} },
    arrowTip: { props: { background: "var(--neutral-1)" } },
    separator: {
      props: {
        blockSize: "var(--border-width-1)",
        background: "var(--neutral-6)",
        marginBlock: "var(--space-1)",
      },
    },
    itemGroup: {
      props: { display: "flex", flexDirection: "column" },
    },
    itemGroupLabel: {
      props: {
        paddingInline: "var(--space-3)",
        paddingBlock: "var(--space-1)",
        fontSize: "var(--font-size-sm)",
        fontWeight: "var(--weight-medium)",
        color: "var(--neutral-11)",
      },
    },
    item: {
      props: itemLook,
      states: itemStates,
    },
    itemIndicator: {
      props: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        inlineSize: "1rem",
        flexShrink: "0",
      },
    },
    itemText: {
      props: { flex: "1" },
      states: itemStates,
    },
  },
};

/** Form — the "name + component + recipe" record `assemble` accepts. */
export const form: Form = { name: "menu-sample", component: "menu", recipe };
