import type { Form, SlotRecipe } from "@omnifield/probe-web-skin/model";

export const recipe: SlotRecipe = {
  base: {
    root: {
      props: {
        display: "grid",
        gap: "var(--space-4)",
        gridTemplateColumns: "repeat(auto-fill, minmax(var(--space-32), 1fr))",
      },
    },
    cell: { props: { display: "block", minWidth: "0" } },
  },
  variants: {
    gallery: {
      root: {
        props: { gridTemplateColumns: "repeat(auto-fill, minmax(var(--space-32), 1fr))" },
      },
    },
    sidebar: {
      root: {
        props: { gridTemplateColumns: "minmax(var(--space-32), var(--column-24)) 1fr" },
      },
    },
    stack: {
      root: {
        props: { gridTemplateColumns: "1fr", gridTemplateRows: "auto 1fr", minBlockSize: "0" },
      },
    },
  },
  defaultVariant: "gallery",
};

export const form: Form = { name: "grid-sample", component: "grid", recipe };
