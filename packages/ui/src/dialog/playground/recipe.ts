import type { Form, SlotRecipe } from "@web-core/skin/model";

const transition = "background-color var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out)";

export const recipe: SlotRecipe = {
  base: {
    control: {
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
      states: {
        open: { props: { background: "var(--neutral-4)" } },
        closed: { props: { background: "var(--neutral-3)" } },
        current: { props: { background: "var(--accent-3)" } },
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
    backdrop: {
      props: {
        position: "fixed",
        inset: "0",
        background: "oklch(0% 0 0 / 0.4)",
      },
      states: {
        open: { props: { display: "block" } },
        closed: { props: { display: "none" } },
      },
    },
    content: {
      props: { isolation: "isolate" },
      states: {
        open: { props: { display: "contents" } },
        closed: { props: { display: "none" } },
      },
    },
    closeTrigger: {
      props: {
        position: "absolute",
        top: "var(--space-3)",
        insetInlineEnd: "var(--space-3)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        inlineSize: "1.75rem",
        blockSize: "1.75rem",
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
  },
};

export const form: Form = { name: "dialog-sample", component: "dialog", recipe };
