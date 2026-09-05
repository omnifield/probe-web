import type { Form, SlotRecipe } from "@web-core/skin/model";

const sortColor = "color var(--motion-fast) var(--ease-out)";

const checkboxLook = {
  width: "1rem",
  height: "1rem",
  cursor: "pointer",
} as const;

const checkboxStates = {
  checked: { props: { accentColor: "var(--accent-9)" } },
  disabled: { props: { opacity: "0.5", cursor: "not-allowed" } },
  hover: { props: { opacity: "0.85" } },
  active: { props: { opacity: "0.7" } },
  "focus-visible": {
    props: {
      outline: "var(--border-width-2) solid var(--accent-8)",
      outlineOffset: "var(--space-1)",
    },
  },
} as const;

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
        "pinned-start": {
          props: { position: "sticky", insetInlineStart: "0", zIndex: "1", background: "var(--neutral-1)" },
        },
        "pinned-end": {
          props: { position: "sticky", insetInlineEnd: "0", zIndex: "1", background: "var(--neutral-1)" },
        },
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
    headerSelectTrigger: {
      props: checkboxLook,
      states: { ...checkboxStates, indeterminate: { props: { accentColor: "var(--accent-9)" } } },
    },
    body: { props: { display: "table-row-group" } },
    row: {
      props: { display: "table-row" },
      states: { selected: { props: { background: "var(--accent-2)" } } },
    },
    cell: {
      props: {
        paddingInline: "var(--space-3)",
        paddingBlock: "var(--space-2)",
        borderBlockEnd: "var(--border-width-1) solid var(--neutral-4)",
      },
      states: {
        "pinned-start": {
          props: { position: "sticky", insetInlineStart: "0", zIndex: "1", background: "var(--neutral-1)" },
        },
        "pinned-end": {
          props: { position: "sticky", insetInlineEnd: "0", zIndex: "1", background: "var(--neutral-1)" },
        },
      },
    },
    rowSelectTrigger: {
      props: checkboxLook,
      states: checkboxStates,
    },
  },
};

export const form: Form = { name: "table-sample", component: "table", recipe };
