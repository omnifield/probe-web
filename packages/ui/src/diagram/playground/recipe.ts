import type { Form, SlotRecipe } from "@omnifield/probe-web-skin/model";

export const recipe: SlotRecipe = {
  base: {
    root: { props: { display: "block", color: "var(--neutral-12)" } },
    axis: {
      props: { fontSize: "var(--font-size-sm)" },
      states: {
        x: { props: { color: "var(--neutral-11)" } },
        y: { props: { color: "var(--neutral-11)" } },
      },
    },
    grid: {
      props: { color: "var(--neutral-11)", opacity: "0.25" },
      states: {
        x: { props: { color: "var(--neutral-11)", opacity: "0.25" } },
        y: { props: { color: "var(--neutral-11)", opacity: "0.25" } },
      },
    },
  },
};

export const form: Form = { name: "diagram-sample", component: "diagram", recipe };
