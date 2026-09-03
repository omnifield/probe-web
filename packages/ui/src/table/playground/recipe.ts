import type { Form, SlotRecipe } from "@omnifield/probe-web-skin/model";

const sortColor = "color var(--motion-fast) var(--ease-out)";

export const recipe: SlotRecipe = {
  base: {
    root: {
      props: {
        width: "100%",
        borderCollapse: "collapse",
        fontSize: "var(--font-size-md)",
        color: "var(--neutral-12)",
      },
    },
    caption: {
      props: {
        captionSide: "top",
        textAlign: "start",
        paddingBlock: "var(--space-2)",
        color: "var(--neutral-11)",
        fontSize: "var(--font-size-sm)",
      },
    },
    head: { props: { display: "table-header-group" } },
    headRow: { props: { display: "table-row" } },
    headerCell: {
      props: {
        textAlign: "start",
        paddingInline: "var(--space-3)",
        paddingBlock: "var(--space-2)",
        borderBlockEnd: "var(--border-width-2) solid var(--neutral-6)",
        fontWeight: "var(--weight-medium)",
        fontSize: "var(--font-size-sm)",
        color: "var(--neutral-11)",
      },
      states: {
        ascending: { props: { color: "var(--neutral-12)" } },
        descending: { props: { color: "var(--neutral-12)" } },
        none: { props: { color: "var(--neutral-11)" } },
      },
    },
    headerSortTrigger: {
      props: {
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-2)",
        borderWidth: "0",
        padding: "0",
        background: "transparent",
        font: "inherit",
        color: "inherit",
        cursor: "pointer",
        transition: sortColor,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        ascending: { props: { color: "var(--accent-11)" } },
        descending: { props: { color: "var(--accent-11)" } },
        none: { props: { color: "inherit" } },
        hover: { props: { color: "var(--neutral-12)" } },
        active: { props: { color: "var(--accent-11)" } },
        "focus-visible": {
          props: {
            outline: "var(--border-width-2) solid var(--accent-8)",
            outlineOffset: "var(--space-1)",
          },
        },
        disabled: { props: { cursor: "default" } },
      },
    },
    body: { props: { display: "table-row-group" } },
    row: { props: { display: "table-row" } },
    cell: {
      props: {
        paddingInline: "var(--space-3)",
        paddingBlock: "var(--space-2)",
        borderBlockEnd: "var(--border-width-1) solid var(--neutral-4)",
      },
    },
  },
};

export const form: Form = { name: "table-sample", component: "table", recipe };
