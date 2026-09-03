import type { Form, SlotRecipe } from "@omnifield/probe-web-skin/model";

const transition = "background-color var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out)";

export const recipe: SlotRecipe = {
  base: {
    root: {
      props: {
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-2)",
      },
      states: {
        disabled: { props: { opacity: "0.6" } },
      },
    },
    label: {
      props: {
        fontSize: "var(--font-size-md)",
        fontWeight: "var(--weight-medium)",
        color: "var(--neutral-12)",
      },
      states: {
        disabled: { props: { color: "var(--neutral-11)" } },
      },
    },
    input: {
      props: {
        paddingInline: "var(--space-3)",
        paddingBlock: "var(--space-2)",
        borderRadius: "var(--radius-md)",
        borderWidth: "var(--border-width-1)",
        borderStyle: "solid",
        borderColor: "var(--neutral-7)",
        background: "var(--neutral-1)",
        color: "var(--neutral-12)",
        fontSize: "var(--font-size-md)",
        transition: "border-color var(--motion-fast) var(--ease-out)",
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        disabled: {
          props: { borderColor: "var(--neutral-6)", background: "var(--neutral-3)", cursor: "not-allowed" },
        },
      },
    },
    content: {
      props: {
        display: "flex",
        flexDirection: "column",
        outline: "none",
      },
      states: {
        empty: {
          props: { alignItems: "center", justifyContent: "center", minHeight: "6rem" },
        },
      },
    },
    itemGroup: {
      props: {
        display: "flex",
        flexDirection: "column",
      },
      states: {
        disabled: { props: { opacity: "0.6" } },
        empty: { props: { display: "none" } },
      },
    },
    itemGroupLabel: {
      props: {
        paddingInline: "var(--space-3)",
        paddingBlock: "var(--space-2)",
        fontSize: "var(--font-size-sm)",
        fontWeight: "var(--weight-medium)",
        color: "var(--neutral-11)",
      },
    },
    item: {
      props: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--space-2)",
        paddingInline: "var(--space-3)",
        paddingBlock: "var(--space-2)",
        color: "var(--neutral-12)",
        cursor: "pointer",
        transition,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        unchecked: { props: { color: "var(--neutral-12)" } },
        highlighted: { props: { color: "var(--neutral-12)" } },
        checked: { props: { color: "var(--accent-11)", fontWeight: "var(--weight-medium)" } },
        disabled: { props: { color: "var(--neutral-11)", cursor: "not-allowed" } },
      },
    },
    itemText: {
      props: {
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        color: "var(--neutral-12)",
      },
      states: {
        unchecked: { props: { color: "var(--neutral-12)" } },
        highlighted: { props: { color: "var(--neutral-12)" } },
        checked: { props: { color: "var(--accent-11)", fontWeight: "var(--weight-medium)" } },
        disabled: { props: { color: "var(--neutral-11)" } },
      },
    },
    itemIndicator: {
      props: { color: "var(--accent-11)" },
      states: {
        checked: { props: { display: "inline-flex" } },
        unchecked: { props: { display: "none" } },
      },
    },
    valueText: {
      props: {
        fontSize: "var(--font-size-sm)",
        color: "var(--neutral-11)",
      },
      states: {
        disabled: { props: { opacity: "0.7" } },
      },
    },
    empty: {
      props: {
        fontSize: "var(--font-size-sm)",
        color: "var(--neutral-11)",
      },
    },
  },
  variants: {
    comfortable: {
      content: { props: { gap: "var(--space-1)", padding: "var(--space-1)" } },
      item: { props: { paddingInline: "var(--space-3)", paddingBlock: "var(--space-2)" } },
      itemGroupLabel: { props: { paddingBlock: "var(--space-2)" } },
    },
    compact: {
      content: { props: { gap: "0", padding: "0" } },
      item: { props: { paddingInline: "var(--space-1)", paddingBlock: "var(--space-1)" } },
      itemGroupLabel: { props: { paddingBlock: "var(--space-1)", fontSize: "var(--font-size-xs)" } },
    },
  },
  defaultVariant: "comfortable",
};

export const form: Form = { name: "listbox-sample", component: "listbox", recipe };
