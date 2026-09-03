import type { Form, SlotRecipe } from "@omnifield/probe-web-skin/model";

export const recipe: SlotRecipe = {
  base: {
    root: {
      props: {
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "var(--space-3)",
      },
    },
    item: { props: { display: "block", minWidth: "0" } },
  },
  variants: {
    row: {
      root: { props: { flexDirection: "row", flexWrap: "wrap", alignItems: "center" } },
    },
    column: {
      root: { props: { flexDirection: "column", flexWrap: "nowrap", alignItems: "stretch" } },
    },
  },
  defaultVariant: "row",
};

export const form: Form = { name: "flow-sample", component: "flow", recipe };
