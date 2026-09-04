import type { Form, SlotRecipe } from "@web-core/skin/model";

const transition = "background-color var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out)";

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
    positioner: {
      props: {
        position: "fixed",
        inset: "0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-4)",
        pointerEvents: "none",
      },
    },
    content: {
      props: {
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-3)",
        width: "100%",
        maxWidth: "28rem",
        padding: "var(--space-6)",
        background: "var(--neutral-1)",
        borderWidth: "var(--border-width-1)",
        borderStyle: "solid",
        borderColor: "var(--neutral-6)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "0 8px 32px oklch(0% 0 0 / 0.2)",
        pointerEvents: "auto",
      },
      states: {
        open: {
          props: {
            animation: "dialog-in var(--motion-normal) var(--ease-out)",
            "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          },
        },
        closed: {
          props: {
            animation: "dialog-out var(--motion-fast) var(--ease-in)",
            "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          },
        },
      },
    },
    title: {
      props: {
        fontSize: "var(--font-size-lg)",
        fontWeight: "var(--weight-semibold)",
        color: "var(--neutral-12)",
      },
    },
    description: {
      props: {
        fontSize: "var(--font-size-md)",
        color: "var(--neutral-11)",
        lineHeight: "var(--leading-relaxed)",
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

export const keyframes = {
  "dialog-in": {
    from: { opacity: "0", transform: "scale(0.96)" },
    to: { opacity: "1", transform: "scale(1)" },
  },
  "dialog-out": {
    from: { opacity: "1", transform: "scale(1)" },
    to: { opacity: "0", transform: "scale(0.96)" },
  },
};

export const form: Form = { name: "dialog-sample", component: "dialog", recipe, keyframes };
