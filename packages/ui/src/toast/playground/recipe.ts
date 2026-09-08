import type { Form, SlotRecipe } from "@web-core/skin/model";

const transition = "background-color var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out)";

export const recipe: SlotRecipe = {
  base: {
    group: {
      props: {
        position: "fixed",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-3)",
      },
    },
    root: {
      props: {
        translate: "var(--x) var(--y)",
        scale: "var(--scale)",
        zIndex: "var(--z-index)",
        blockSize: "var(--height)",
        opacity: "var(--opacity)",
        borderRadius: "var(--radius-md)",
        background: "var(--neutral-3)",
        color: "var(--neutral-12)",
        paddingInline: "var(--space-4)",
        paddingBlock: "var(--space-3)",
        willChange: "translate, opacity, scale",
      },
      states: {
        open: { props: { display: "block" } },
        closed: { props: { display: "none" } },
      },
    },
    title: {
      props: { fontSize: "var(--font-size-md)", fontWeight: "var(--weight-semibold)" },
    },
    description: {
      props: { fontSize: "var(--font-size-md)", color: "var(--neutral-11)" },
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

export const form: Form = { name: "toast-sample", component: "toast", recipe };
