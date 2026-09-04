import type { Form, SlotRecipe } from "@web-core/skin/model";

const rootTransition = "background-color var(--motion-fast) var(--ease-out)";
const trackTransition = "background-color var(--motion-fast) var(--ease-out)";
const thumbTransition = "transform var(--motion-fast) var(--ease-out), box-shadow var(--motion-fast) var(--ease-out)";

export const recipe: SlotRecipe = {
  base: {
    root: {
      props: {
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-2)",
        borderRadius: "var(--radius-md)",
        cursor: "pointer",
        transition: rootTransition,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        checked: { props: { cursor: "pointer" } },
        unchecked: { props: { cursor: "pointer" } },
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
        unchecked: { props: { background: "var(--neutral-6)" } },
        hover: { props: { background: "var(--neutral-7)" } },
        active: { props: { transform: "scale(0.96)" } },
        focus: { props: { outline: "none" } },
        "focus-visible": {
          props: {
            outline: "var(--border-width-2) solid var(--accent-8)",
            outlineOffset: "var(--space-1)",
          },
        },
        invalid: { props: { background: "var(--danger-9)" } },
        required: { props: { background: "var(--neutral-6)" } },
        disabled: { props: { background: "var(--neutral-4)" } },
        readonly: { props: { cursor: "default" } },
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
        unchecked: { props: { transform: "translateX(0)" } },
        hover: { props: { boxShadow: "0 1px 3px oklch(0% 0 0 / 0.3)" } },
        active: { props: { boxShadow: "0 1px 1px oklch(0% 0 0 / 0.2)" } },
        focus: { props: { boxShadow: "0 1px 2px oklch(0% 0 0 / 0.24)" } },
        "focus-visible": { props: { boxShadow: "0 1px 2px oklch(0% 0 0 / 0.24)" } },
        invalid: { props: { boxShadow: "0 1px 2px oklch(0% 0 0 / 0.24)" } },
        required: { props: { boxShadow: "0 1px 2px oklch(0% 0 0 / 0.24)" } },
        disabled: { props: { opacity: "0.6" } },
        readonly: { props: { opacity: "0.8" } },
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

export const form: Form = { name: "switch-sample", component: "switch", recipe };
