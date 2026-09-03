import type { Form, SlotRecipe } from "@omnifield/probe-web-skin/model";

export const recipe: SlotRecipe = {
  base: {
    root: {
      props: {
        display: "block",
        padding: "var(--space-1)",
        borderRadius: "var(--radius-lg)",
        background: "var(--neutral-1)",
        color: "var(--neutral-12)",
        fontSize: "var(--font-size-md)",
        lineHeight: "var(--leading-normal)",
      },
    },
  },
  variants: {
    plain: { root: { props: { background: "var(--neutral-1)", color: "var(--neutral-12)" } } },
    raised: {
      root: {
        props: {
          background: "var(--neutral-2)",
          color: "var(--neutral-12)",
          borderWidth: "var(--border-width-1)",
          borderStyle: "solid",
          borderColor: "var(--neutral-6)",
        },
      },
    },
  },
  defaultVariant: "plain",
};

export const form: Form = { name: "surface-sample", component: "surface", recipe };
