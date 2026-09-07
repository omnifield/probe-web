import type { Form, SlotRecipe } from "@web-core/skin/model";

export const recipe: SlotRecipe = {
  base: {
    root: {
      props: {
        margin: "0",
        color: "var(--neutral-12)",
        fontSize: "var(--font-size-md)",
        lineHeight: "var(--leading-normal)",
      },
    },
  },
  variants: {
    body: {},
    heading: {
      root: {
        props: {
          fontSize: "var(--font-size-xl)",
          fontWeight: "var(--weight-bold)",
          lineHeight: "var(--leading-tight)",
        },
      },
    },
    caption: {
      root: {
        props: {
          color: "var(--neutral-11)",
          fontSize: "var(--font-size-sm)",
          lineHeight: "var(--leading-snug)",
        },
      },
    },
  },
  defaultVariant: "body",
};

export const form: Form = { name: "typography-sample", component: "typography", recipe };
