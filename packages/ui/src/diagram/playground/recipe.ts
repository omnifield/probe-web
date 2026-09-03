import type { Form, SlotRecipe } from "@omnifield/probe-web-skin/model";

export const recipe: SlotRecipe = {
  base: {
    root: { props: { display: "block", color: "var(--neutral-12)" } },
  },
};

export const form: Form = { name: "diagram-sample", component: "diagram", recipe };
