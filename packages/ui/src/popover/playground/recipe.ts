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
        ...buttonStates,
        open: { props: { background: "var(--neutral-4)" } },
        closed: { props: { background: "var(--neutral-3)" } },
        current: { props: { background: "var(--accent-3)" } },
      },
    },
    controlIndicator: {
      props: {
        display: "inline-flex",
        transition: "transform var(--motion-fast) var(--ease-out)",
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        open: { props: { transform: "rotate(180deg)" } },
        closed: { props: { transform: "rotate(0deg)" } },
      },
    },
    anchor: { props: { display: "contents" } },
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
      states: {
        open: {
          props: {
            animation: "popover-in var(--motion-fast) var(--ease-out)",
            "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          },
        },
        closed: {
          props: {
            animation: "popover-out var(--motion-fast) var(--ease-in)",
            "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          },
        },
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
    arrow: { props: { "--arrow-size": "10px" } },
    arrowTip: { props: { "--arrow-background": "var(--neutral-1)" } },
  },
};

export const keyframes = {
  "popover-in": {
    from: { opacity: "0", transform: "scale(0.96)" },
    to: { opacity: "1", transform: "scale(1)" },
  },
  "popover-out": {
    from: { opacity: "1", transform: "scale(1)" },
    to: { opacity: "0", transform: "scale(0.96)" },
  },
};

export const form: Form = { name: "popover-sample", component: "popover", recipe, keyframes };
