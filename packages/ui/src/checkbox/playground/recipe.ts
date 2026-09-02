import type { Form, SlotRecipe } from "@omnifield/probe-web-skin/model";

const transition = "background-color var(--motion-fast) var(--ease-out), border-color var(--motion-fast) var(--ease-out)";

export const recipe: SlotRecipe = {
  base: {
    root: {
      props: {
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-2)",
        borderRadius: "var(--radius-sm)",
        cursor: "pointer",
        transition: "background-color var(--motion-fast) var(--ease-out)",
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        checked: { props: { cursor: "pointer" } },
        unchecked: { props: { cursor: "pointer" } },
        indeterminate: { props: { cursor: "pointer" } },
        disabled: { props: { cursor: "not-allowed", opacity: "0.5" } },
        readonly: { props: { cursor: "default" } },
        invalid: { props: { cursor: "pointer" } },
        required: { props: { cursor: "pointer" } },
        hover: { props: { background: "var(--neutral-2)" } },
        active: { props: { background: "var(--neutral-3)" } },
        focus: { props: { outline: "none" } },
        "focus-visible": {
          props: {
            outline: "var(--border-width-2) solid var(--accent-8)",
            outlineOffset: "var(--space-1)",
          },
        },
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
        unchecked: { props: { borderColor: "var(--neutral-7)" } },
        indeterminate: { props: { borderColor: "var(--accent-9)", background: "var(--accent-9)" } },
        hover: { props: { borderColor: "var(--accent-8)" } },
        active: { props: { transform: "scale(0.92)" } },
        focus: { props: { outline: "none" } },
        "focus-visible": {
          props: {
            outline: "var(--border-width-2) solid var(--accent-8)",
            outlineOffset: "var(--space-1)",
          },
        },
        invalid: { props: { borderColor: "var(--danger-9)" } },
        disabled: { props: { borderColor: "var(--neutral-6)", background: "var(--neutral-3)" } },
        readonly: { props: { cursor: "default" } },
        required: { props: { borderColor: "var(--neutral-7)" } },
      },
    },
    indicator: {
      props: {
        color: "var(--accent-contrast)",
        fontSize: "var(--font-size-sm)",
        lineHeight: "1",
      },
      states: {
        checked: { props: { display: "inline-flex" } },
        unchecked: { props: { display: "none" } },
        indeterminate: { props: { display: "inline-flex" } },
        disabled: { props: { opacity: "0.6" } },
        readonly: { props: { opacity: "0.8" } },
        invalid: { props: { color: "var(--accent-contrast)" } },
        required: { props: { color: "var(--accent-contrast)" } },
        hover: { props: { opacity: "1" } },
        active: { props: { opacity: "1" } },
        focus: { props: { opacity: "1" } },
        "focus-visible": { props: { opacity: "1" } },
      },
    },
    label: {
      props: {
        fontSize: "var(--font-size-md)",
        color: "var(--neutral-12)",
      },
      states: {
        checked: { props: { fontWeight: "var(--weight-medium)" } },
        unchecked: { props: { fontWeight: "var(--weight-normal)" } },
        indeterminate: { props: { fontWeight: "var(--weight-medium)" } },
        disabled: { props: { color: "var(--neutral-11)" } },
        readonly: { props: { color: "var(--neutral-12)" } },
        invalid: { props: { color: "var(--danger-11)" } },
        required: { props: { fontWeight: "var(--weight-medium)" } },
        hover: { props: { textDecoration: "underline" } },
        active: { props: { opacity: "0.85" } },
        focus: { props: { outline: "none" } },
        "focus-visible": { props: { textDecoration: "underline" } },
      },
    },
  },
};

export const form: Form = { name: "checkbox-sample", component: "checkbox", recipe };
