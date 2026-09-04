import type { Form, SlotRecipe } from "@web-core/skin/model";

const transition = "background-color var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out), border-color var(--motion-fast) var(--ease-out)";

export const recipe: SlotRecipe = {
  base: {
    root: {
      props: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--space-2)",
        minHeight: "var(--control-height-md)",
        paddingInline: "var(--space-4)",
        borderRadius: "var(--radius-md)",
        borderWidth: "var(--border-width-1)",
        borderStyle: "solid",
        fontSize: "var(--font-size-md)",
        fontWeight: "var(--weight-medium)",
        lineHeight: "var(--leading-none)",
        letterSpacing: "var(--tracking-normal)",
        cursor: "pointer",
        transition,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        "focus-visible": {
          props: {
            outline: "var(--border-width-2) solid var(--accent-8)",
            outlineOffset: "var(--space-1)",
          },
        },
        hover: { props: { cursor: "pointer" } },
        active: { props: { transform: "translateY(var(--border-width-1))" } },
        disabled: {
          props: { opacity: "0.5", cursor: "not-allowed" },
          states: { hover: { props: { transform: "none" } } },
        },
        busy: { props: { cursor: "progress" } },
        expanded: { props: { borderColor: "var(--accent-8)" } },
        pressed: { props: { borderColor: "var(--accent-8)", fontWeight: "var(--weight-semibold)" } },
      },
    },
  },
  variants: {
    primary: {
      root: {
        props: {
          background: "var(--accent-9)",
          color: "var(--accent-contrast)",
          borderColor: "transparent",
        },
        states: {
          hover: { props: { background: "var(--accent-10)", color: "var(--accent-contrast)" } },
        },
      },
    },
    quiet: {
      root: {
        props: {
          background: "var(--neutral-3)",
          color: "var(--neutral-12)",
          borderColor: "var(--neutral-7)",
        },
        states: {
          hover: { props: { background: "var(--neutral-4)", color: "var(--neutral-12)" } },
          active: { props: { background: "var(--neutral-5)", color: "var(--neutral-12)" } },
        },
      },
    },
    danger: {
      root: {
        props: {
          background: "var(--danger-9)",
          color: "var(--danger-contrast)",
          borderColor: "transparent",
        },
        states: {
          hover: { props: { background: "var(--danger-10)", color: "var(--danger-contrast)" } },
        },
      },
    },
  },
  defaultVariant: "primary",
  compoundVariants: [
    {
      variants: ["primary", "danger"],
      states: ["active"],
      style: { root: { props: { filter: "brightness(0.94)" } } },
    },
  ],
};

export const form: Form = { name: "button-sample", component: "button", recipe };
