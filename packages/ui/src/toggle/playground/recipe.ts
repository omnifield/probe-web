import type { Form, SlotRecipe } from "@web-core/skin/model";

const transition = "background-color var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out)";

export const recipe: SlotRecipe = {
  base: {
    root: {
      props: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minBlockSize: "var(--control-height-md)",
        minInlineSize: "var(--control-height-md)",
        borderWidth: "0",
        borderRadius: "var(--radius-md)",
        background: "var(--neutral-3)",
        color: "var(--neutral-12)",
        fontSize: "var(--font-size-md)",
        cursor: "pointer",
        transition,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        on: { props: { background: "var(--accent-9)", color: "var(--accent-contrast)" } },
        off: { props: { background: "var(--neutral-3)", color: "var(--neutral-12)" } },
        pressed: { props: { background: "var(--accent-9)", color: "var(--accent-contrast)" } },
        disabled: { props: { cursor: "not-allowed", opacity: "0.5" } },
        hover: { props: { background: "var(--neutral-4)" } },
        active: { props: { transform: "scale(0.94)" } },
        "focus-visible": {
          props: {
            outline: "var(--border-width-2) solid var(--accent-8)",
            outlineOffset: "var(--border-width-2)",
          },
        },
      },
    },
    indicator: {
      props: {
        display: "inline-flex",
        fontSize: "var(--font-size-md)",
        lineHeight: "1",
      },
      states: {
        on: { props: { opacity: "1" } },
        off: { props: { opacity: "0.7" } },
        pressed: { props: { opacity: "1" } },
        disabled: { props: { opacity: "0.6" } },
      },
    },
  },
};

export const form: Form = { name: "toggle-sample", component: "toggle", recipe };
