// PROOF RECIPE (`PWEB-111`, `PWEB-114`) — not a shipped product, not product taste. Lives next
// to the component, but is NEVER exported from `index.ts`/`passport.ts`/`kit.ts` — only
// `checkbox.test.tsx` reads it, to prove the checkbox's passport CAN be dressed whole by the
// real skin mechanism (`skinGaps` empty, CSS is generated).

import type { Form, SlotRecipe } from "@omnifield/probe-web-skin/model";

/** Look transition — same device as the button and the accordion. */
const transition = "background-color var(--motion-fast) var(--ease-out), border-color var(--motion-fast) var(--ease-out)";

/**
 * CHECKBOX. Four parts, eleven states.
 *
 * The control frame carries the border and fill; the indicator only carries the mark's color
 * (the mark itself is placed by the consumer). Checked and indeterminate both paint the frame
 * with a solid accent — both read as "there is a choice", the ordinary market norm.
 */
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
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        width: "var(--control-height-sm)",
        height: "var(--control-height-sm)",
        borderRadius: "var(--radius-sm)",
        borderWidth: "var(--border-width-1)",
        borderStyle: "solid",
        borderColor: "var(--neutral-7)",
        background: "var(--neutral-1)",
        transition,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        checked: { props: { borderColor: "var(--accent-9)", background: "var(--accent-9)" } },
        indeterminate: { props: { borderColor: "var(--accent-9)", background: "var(--accent-9)" } },
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
    // `display` IS NOT IN THE BASE: the kit hides the indicator with the `hidden` attribute
    // (native `display: none`) while the checkbox is neither checked nor indeterminate — an
    // unconditional `display: inline-flex` in the base would override that for EVERY checkbox
    // at once, and the mark would always show. `display` is set alongside the same two states
    // that lift `hidden`.
    indicator: {
      props: {
        color: "var(--accent-contrast)",
        fontSize: "var(--font-size-sm)",
        lineHeight: "1",
      },
      states: {
        checked: { props: { display: "inline-flex" } },
        indeterminate: { props: { display: "inline-flex" } },
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
export const form: Form = { name: "checkbox-sample", component: "checkbox", recipe };
