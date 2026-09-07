import type { Form, SlotRecipe } from "@web-core/skin/model";

export const recipe: SlotRecipe = {
  base: {
    root: {
      props: {
        translate: "var(--x) var(--y)",
        scale: "var(--scale)",
        opacity: "var(--opacity)",
      },
      states: {
        open: { props: { display: "block" } },
        closed: { props: { display: "none" } },
      },
    },
  },
};

export const form: Form = { name: "toast-sample", component: "toast", recipe };
