// PROOF RECIPE (`PWEB-111`) — not a shipped product, not product taste. Lives next to the
// component, but is NEVER exported from `index.ts`/`passport.ts`/`kit.ts` — only proves the
// passport CAN be dressed whole by the real skin mechanism (`skinGaps` empty, CSS is generated).
// Same physical shape as every other component's `playground/recipe.ts` (`PWEB-127`).
//
// `input`/`select`/`textarea` share ONE look (`../entity/passport.ts`'s own `controlStates`):
// interchangeable renderers of the same conceptual control, not three different looks.

import type { Form, SlotRecipe } from "@omnifield/probe-web-skin/model";

const controlTransition = "border-color var(--motion-fast) var(--ease-out), background-color var(--motion-fast) var(--ease-out)";

const controlProps = {
  boxSizing: "border-box",
  width: "100%",
  minBlockSize: "var(--control-height-md)",
  paddingInline: "var(--space-3)",
  borderWidth: "var(--border-width-1)",
  borderStyle: "solid",
  borderColor: "var(--neutral-7)",
  borderRadius: "var(--radius-md)",
  background: "var(--neutral-1)",
  color: "var(--neutral-12)",
  fontSize: "var(--font-size-md)",
  transition: controlTransition,
  "@media (prefers-reduced-motion: reduce)": { transition: "none" },
} as const;

const controlStates = {
  hover: { props: { borderColor: "var(--neutral-8)" } },
  "focus-visible": {
    props: {
      outline: "var(--border-width-2) solid var(--accent-8)",
      outlineOffset: "calc(var(--border-width-2) * -1)",
    },
  },
  invalid: { props: { borderColor: "var(--danger-9)" } },
  readonly: { props: { background: "var(--neutral-2)" } },
  disabled: { props: { background: "var(--neutral-3)", color: "var(--neutral-9)", cursor: "not-allowed" } },
} as const;

export const recipe: SlotRecipe = {
  base: {
    root: {
      props: { display: "flex", flexDirection: "column", gap: "var(--space-1)" },
      states: {
        disabled: { props: { opacity: "0.6" } },
      },
    },
    label: {
      props: {
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-1)",
        fontSize: "var(--font-size-md)",
        fontWeight: "var(--weight-medium)",
        color: "var(--neutral-12)",
      },
      states: {
        disabled: { props: { color: "var(--neutral-11)" } },
      },
    },
    input: { props: controlProps, states: controlStates },
    select: { props: controlProps, states: controlStates },
    textarea: {
      props: {
        ...controlProps,
        minBlockSize: "calc(var(--control-height-md) * 2)",
        paddingBlock: "var(--space-2)",
        resize: "vertical",
      },
      states: controlStates,
    },
    helperText: {
      props: {
        fontSize: "var(--font-size-sm)",
        color: "var(--neutral-11)",
      },
      states: {
        disabled: { props: { color: "var(--neutral-9)" } },
      },
    },
    errorText: {
      props: {
        fontSize: "var(--font-size-sm)",
        color: "var(--danger-11)",
      },
    },
    requiredIndicator: {
      props: {
        color: "var(--danger-9)",
      },
    },
  },
};

/** Form — the "name + component + recipe" record `assemble` accepts. */
export const form: Form = { name: "field-sample", component: "field", recipe };
