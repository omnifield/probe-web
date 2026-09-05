import type { Form, SlotRecipe } from "@web-core/skin/model";

export const recipe: SlotRecipe = {
  base: {
    root: {
      props: {
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "var(--control-height-md)",
        height: "var(--control-height-md)",
        flexShrink: "0",
        overflow: "hidden",
        borderRadius: "var(--radius-full)",
        background: "var(--neutral-3)",
      },
    },
    image: {
      props: {
        position: "absolute",
        inset: "0",
        width: "100%",
        height: "100%",
        objectFit: "cover",
      },
      states: {
        visible: { props: { display: "block" } },
        hidden: { props: { display: "none" } },
      },
    },
    fallback: {
      props: {
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        color: "var(--neutral-11)",
        fontSize: "var(--font-size-sm)",
        fontWeight: "var(--weight-medium)",
        textTransform: "uppercase",
      },
      states: {
        visible: { props: { display: "flex" } },
        hidden: { props: { display: "none" } },
      },
    },
  },
};

export const form: Form = { name: "avatar-sample", component: "avatar", recipe };
