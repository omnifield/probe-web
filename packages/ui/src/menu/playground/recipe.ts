import type { Form, SlotRecipe } from "@web-core/skin/model";

const transition = "background-color var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out)";

const buttonStates = {
  hover: { props: { background: "var(--neutral-4)" } },
  active: { props: { background: "var(--neutral-5)" } },
  "focus-visible": {
    props: {
      outline: "var(--border-width-2) solid var(--accent-8)",
      outlineOffset: "var(--border-width-2)",
    },
  },
} as const;

const itemLook = {
  display: "flex",
  alignItems: "center",
  gap: "var(--space-2)",
  paddingInline: "var(--space-3)",
  paddingBlock: "var(--space-2)",
  borderRadius: "var(--radius-md)",
  fontSize: "var(--font-size-md)",
  color: "var(--neutral-12)",
  cursor: "pointer",
  transition,
  "@media (prefers-reduced-motion: reduce)": { transition: "none" },
} as const;

const itemStates = {
  highlighted: { props: { background: "var(--accent-9)", color: "var(--accent-contrast)" } },
  disabled: { props: { opacity: "0.5", cursor: "not-allowed" } },
  checked: { props: { background: "var(--accent-3)" } },
  unchecked: { props: { background: "transparent" } },
  radio: { props: { cursor: "pointer" } },
  checkbox: { props: { cursor: "pointer" } },
} as const;

export const recipe: SlotRecipe = {
  base: {
    trigger: {
      props: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minBlockSize: "var(--control-height-md)",
        paddingInline: "var(--space-4)",
        borderWidth: "0",
        borderRadius: "var(--radius-md)",
        background: "var(--neutral-3)",
        color: "var(--neutral-12)",
        fontSize: "var(--font-size-md)",
        cursor: "pointer",
        transition,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        ...buttonStates,
        open: { props: { background: "var(--neutral-4)" } },
        closed: { props: { background: "var(--neutral-3)" } },
        current: { props: { background: "var(--neutral-4)" } },
      },
    },
    triggerItem: {
      props: { ...itemLook, justifyContent: "space-between" },
      states: {
        highlighted: itemStates.highlighted,
        disabled: itemStates.disabled,
        open: { props: { background: "var(--accent-3)" } },
        closed: { props: { background: "transparent" } },
      },
    },
    contextTrigger: {
      props: { display: "contents" },
      states: {
        open: { props: { cursor: "context-menu" } },
        closed: { props: { cursor: "default" } },
        current: { props: { cursor: "context-menu" } },
      },
    },
    indicator: {
      props: {
        display: "inline-flex",
        transition: "transform var(--motion-fast) var(--ease-out)",
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        open: { props: { transform: "rotate(180deg)" } },
        closed: { props: { transform: "rotate(0deg)" } },
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
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-1)",
        minWidth: "12rem",
        padding: "var(--space-1)",
        background: "var(--neutral-1)",
        borderWidth: "var(--border-width-1)",
        borderStyle: "solid",
        borderColor: "var(--neutral-6)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "0 4px 16px oklch(0% 0 0 / 0.16)",
      },
      states: {
        open: { props: { opacity: "1" } },
        closed: { props: { opacity: "0" } },
      },
    },
    arrow: { props: { position: "absolute" } },
    arrowTip: { props: { background: "var(--neutral-1)" } },
    separator: {
      props: {
        blockSize: "var(--border-width-1)",
        background: "var(--neutral-6)",
        marginBlock: "var(--space-1)",
      },
    },
    itemGroup: {
      props: { display: "flex", flexDirection: "column" },
    },
    itemGroupLabel: {
      props: {
        paddingInline: "var(--space-3)",
        paddingBlock: "var(--space-1)",
        fontSize: "var(--font-size-sm)",
        fontWeight: "var(--weight-medium)",
        color: "var(--neutral-11)",
      },
    },
    item: {
      props: itemLook,
      states: itemStates,
    },
    itemIndicator: {
      props: { display: "inline-flex", alignItems: "center", justifyContent: "center", inlineSize: "1rem", flexShrink: "0", color: "var(--accent-11)" },
      states: {
        checked: { props: { display: "inline-flex" } },
        unchecked: { props: { display: "none" } },
        highlighted: { props: { color: "var(--accent-contrast)" } },
        disabled: { props: { opacity: "0.6" } },
      },
    },
    itemText: {
      props: { flex: "1" },
      states: {
        highlighted: itemStates.highlighted,
        disabled: itemStates.disabled,
        checked: { props: { fontWeight: "var(--weight-medium)" } },
        unchecked: { props: { fontWeight: "var(--weight-normal)" } },
      },
    },
  },
};

export const form: Form = { name: "menu-sample", component: "menu", recipe };
