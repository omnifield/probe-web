import type { Form, SlotRecipe } from "@web-core/skin/model";

const transition = "background-color var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out)";
const slide = "left var(--motion-normal) var(--ease-out), top var(--motion-normal) var(--ease-out), width var(--motion-normal) var(--ease-out), height var(--motion-normal) var(--ease-out)";

export const recipe: SlotRecipe = {
  base: {
    root: {
      props: {
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-1)",
        padding: "var(--space-1)",
        borderRadius: "var(--radius-lg)",
        background: "var(--neutral-3)",
      },
      states: {
        disabled: { props: { opacity: "0.6" } },
        invalid: { props: { opacity: "1" } },
        required: { props: { opacity: "1" } },
      },
    },
    label: {
      props: {
        paddingInline: "var(--space-2)",
        fontSize: "var(--font-size-sm)",
        fontWeight: "var(--weight-medium)",
        color: "var(--neutral-11)",
      },
      states: {
        disabled: { props: { opacity: "0.6" } },
        invalid: { props: { color: "var(--danger-11)" } },
        required: { props: { fontWeight: "var(--weight-semibold)" } },
      },
    },
    item: {
      props: {
        position: "relative",
        display: "inline-flex",
        cursor: "pointer",
      },
      states: {
        checked: { props: { cursor: "pointer" } },
        unchecked: { props: { cursor: "pointer" } },
        disabled: { props: { cursor: "not-allowed" } },
        readonly: { props: { cursor: "default" } },
        invalid: { props: { cursor: "pointer" } },
        hover: { props: { cursor: "pointer" } },
        focus: { props: { outline: "none" } },
        "focus-visible": { props: { outline: "none" } },
      },
    },
    itemControl: {
      props: {
        position: "absolute",
        inset: "0",
        borderRadius: "var(--radius-md)",
        transition,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        checked: { props: { background: "transparent" } },
        unchecked: { props: { background: "transparent" } },
        hover: { props: { background: "var(--neutral-4)" } },
        active: { props: { background: "var(--neutral-5)" } },
        focus: { props: { outline: "none" } },
        "focus-visible": {
          props: {
            outline: "var(--border-width-2) solid var(--accent-8)",
            outlineOffset: "var(--border-width-2)",
          },
        },
        disabled: { props: { background: "transparent" } },
        readonly: { props: { cursor: "default" } },
        invalid: { props: { background: "transparent" } },
      },
    },
    itemText: {
      props: {
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minBlockSize: "var(--control-height-sm)",
        paddingInline: "var(--space-3)",
        fontSize: "var(--font-size-sm)",
        fontWeight: "var(--weight-medium)",
        color: "var(--neutral-11)",
        pointerEvents: "none",
        transition,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        checked: { props: { color: "var(--neutral-12)" } },
        unchecked: { props: { color: "var(--neutral-11)" } },
        disabled: { props: { opacity: "0.6" } },
        readonly: { props: { color: "var(--neutral-12)" } },
        invalid: { props: { color: "var(--danger-11)" } },
        hover: { props: { color: "var(--neutral-12)" } },
        focus: { props: { color: "var(--neutral-12)" } },
        "focus-visible": { props: { color: "var(--neutral-12)" } },
      },
    },
    indicator: {
      props: {
        position: "absolute",
        left: "var(--left)",
        top: "var(--top)",
        width: "var(--width)",
        height: "var(--height)",
        background: "var(--neutral-1)",
        borderRadius: "var(--radius-md)",
        boxShadow: "0 1px 2px oklch(0% 0 0 / 0.16)",
        transition: slide,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        disabled: { props: { boxShadow: "none" } },
      },
    },
  },
  settings: {
    orientation: {
      horizontal: {},
      vertical: {
        root: { props: { flexDirection: "column", alignItems: "stretch" } },
      },
    },
  },
};

export const form: Form = { name: "segment-group-sample", component: "segment-group", recipe };
