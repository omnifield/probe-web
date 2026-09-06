import type { Form, SlotRecipe } from "@web-core/skin/model";

export const recipe: SlotRecipe = {
  base: {
    root: {
      props: {
        display: "inline-block",
        flexShrink: "0",
        width: "1em",
        height: "1em",
        color: "currentColor",
      },
    },
  },
};

export const form: Form = { name: "icon-sample", component: "icon", recipe };
