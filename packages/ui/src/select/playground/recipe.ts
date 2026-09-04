import type { Form, SlotRecipe } from "@web-core/skin/model";

const transition = "background-color var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out), border-color var(--motion-fast) var(--ease-out)";

export const recipe: SlotRecipe = {
  base: {
    root: {
      props: { display: "flex", flexDirection: "column", gap: "var(--space-2)" },
      states: {
        invalid: { props: { opacity: "1" } },
        readonly: { props: { opacity: "1" } },
      },
    },
    label: {
      props: {
        fontSize: "var(--font-size-md)",
        color: "var(--neutral-12)",
      },
      states: {
        disabled: { props: { color: "var(--neutral-11)" } },
        invalid: { props: { color: "var(--danger-11)" } },
        readonly: { props: { color: "var(--neutral-12)" } },
        required: { props: { fontWeight: "var(--weight-medium)" } },
      },
    },
    control: {
      props: {
        display: "flex",
        width: "100%",
        alignItems: "stretch",
        borderRadius: "var(--radius-md)",
        borderWidth: "var(--border-width-1)",
        borderStyle: "solid",
        borderColor: "var(--neutral-7)",
        background: "var(--neutral-1)",
        transition,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        open: { props: { borderColor: "var(--accent-8)" } },
        closed: { props: { borderColor: "var(--neutral-7)" } },
        focus: { props: { borderColor: "var(--accent-8)" } },
        invalid: { props: { borderColor: "var(--danger-9)" } },
        disabled: { props: { borderColor: "var(--neutral-6)", background: "var(--neutral-3)" } },
      },
    },
    trigger: {
      props: {
        display: "flex",
        flex: "1",
        minWidth: "0",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--space-2)",
        minHeight: "var(--control-height-md)",
        paddingInline: "var(--space-4)",
        borderWidth: "0",
        background: "transparent",
        color: "var(--neutral-12)",
        fontSize: "var(--font-size-md)",
        lineHeight: "var(--leading-none)",
        textAlign: "start",
        cursor: "pointer",
      },
      states: {
        open: { props: { cursor: "pointer" } },
        closed: { props: { cursor: "pointer" } },
        "focus-visible": {
          props: {
            outline: "var(--border-width-2) solid var(--accent-8)",
            outlineOffset: "calc(var(--border-width-2) * -1)",
          },
        },
        hover: { props: { background: "var(--neutral-2)" } },
        active: { props: { background: "var(--neutral-3)" } },
        disabled: { props: { cursor: "not-allowed" } },
        invalid: { props: { color: "var(--danger-11)" } },
        readonly: { props: { cursor: "default" } },
        placeholder: { props: { color: "var(--neutral-11)" } },
      },
    },
    valueText: {
      props: { minWidth: "0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
      states: {
        disabled: { props: { color: "var(--neutral-11)" } },
        invalid: { props: { color: "var(--danger-11)" } },
        focus: { props: { opacity: "1" } },
      },
      ancestors: [
        {
          component: "select",
          part: "trigger",
          states: ["placeholder"],
          style: { props: { color: "var(--neutral-11)" } },
        },
      ],
    },
    clearTrigger: {
      props: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        paddingInline: "var(--space-2)",
        color: "var(--neutral-11)",
        cursor: "pointer",
      },
      states: {
        hover: { props: { color: "var(--neutral-12)" } },
        "focus-visible": {
          props: {
            outline: "var(--border-width-2) solid var(--accent-8)",
            outlineOffset: "calc(var(--border-width-2) * -1)",
          },
        },
        active: { props: { color: "var(--neutral-12)" } },
        invalid: { props: { color: "var(--danger-11)" } },
        disabled: { props: { cursor: "not-allowed", opacity: "0.5" } },
      },
    },
    indicator: {
      props: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        paddingInline: "var(--space-2)",
        color: "var(--neutral-11)",
        transition: "transform var(--motion-fast) var(--ease-out)",
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        open: { props: { transform: "rotate(180deg)" } },
        closed: { props: { transform: "rotate(0deg)" } },
        disabled: { props: { opacity: "0.5" } },
        invalid: { props: { color: "var(--danger-11)" } },
        readonly: { props: { opacity: "1" } },
      },
    },
    positioner: {
      props: {
        maxWidth: "var(--available-width)",
        maxHeight: "var(--available-height)",
      },
    },
    content: {
      props: {
        gap: "var(--space-1)",
        padding: "var(--space-1)",
        overflow: "auto",
        borderRadius: "var(--radius-md)",
        borderWidth: "var(--border-width-1)",
        borderStyle: "solid",
        borderColor: "var(--neutral-6)",
        background: "var(--neutral-1)",
      },
      states: {
        open: { props: { display: "flex", flexDirection: "column" } },
        closed: { props: { pointerEvents: "none" } },
      },
    },
    list: {
      props: { display: "flex", flexDirection: "column" },
    },
    itemGroup: {
      props: { display: "flex", flexDirection: "column" },
      states: {
        disabled: { props: { opacity: "0.6" } },
      },
    },
    itemGroupLabel: {
      props: {
        paddingInline: "var(--space-3)",
        paddingBlock: "var(--space-2)",
        fontSize: "var(--font-size-sm)",
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
        borderRadius: "var(--radius-sm)",
        color: "var(--neutral-12)",
        cursor: "pointer",
      },
      states: {
        highlighted: { props: { background: "var(--neutral-4)" } },
        checked: { props: { fontWeight: "var(--weight-medium)" } },
        unchecked: { props: { fontWeight: "var(--weight-normal)" } },
        disabled: { props: { color: "var(--neutral-11)", cursor: "not-allowed" } },
      },
    },
    itemText: {
      props: { minWidth: "0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
      states: {
        highlighted: { props: { color: "var(--neutral-12)" } },
        checked: { props: { fontWeight: "var(--weight-medium)" } },
        unchecked: { props: { fontWeight: "var(--weight-normal)" } },
        disabled: { props: { color: "var(--neutral-11)" } },
      },
    },
    itemIndicator: {
      props: { color: "var(--accent-11)" },
      states: {
        checked: { props: { display: "inline-flex" } },
        unchecked: { props: { pointerEvents: "none" } },
      },
    },
  },
};

export const form: Form = { name: "select-sample", component: "select", recipe };
