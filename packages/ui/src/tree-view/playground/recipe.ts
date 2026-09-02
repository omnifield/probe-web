import type { Form, SlotRecipe } from "@omnifield/probe-web-skin/model";

const transition = "background-color var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out)";

const focusRing = {
  boxShadow: "inset 0 0 0 var(--border-width-2) var(--accent-8)",
};

const selectedFill = { background: "var(--accent-3)", color: "var(--accent-12)" };

const disabledRow = { color: "var(--neutral-11)", cursor: "not-allowed", opacity: "0.6" };

const checkedFill = { background: "var(--accent-2)" };

// --depth считает Zag от 1 (сам repeat, см. indexPathBind) — верхний уровень не должен получать
// отступ, поэтому единицу вычитаем: 1 → 0, 2 → half-space-6, и так далее.
const depthIndent = "calc((var(--depth) - 1) * var(--space-6) / 2)";

export const recipe: SlotRecipe = {
  base: {
    root: {
      props: { display: "flex", flexDirection: "column" },
    },
    item: {
      props: { display: "flex", flexDirection: "column" },
      states: {
        disabled: { props: { pointerEvents: "none" } },
        loading: { props: { pointerEvents: "none" } },
        renaming: { props: { cursor: "text" } },
        focus: { props: { zIndex: "1" } },
        selected: {
          props: {
            borderInlineStartWidth: "var(--border-width-2)",
            borderInlineStartStyle: "solid",
            borderInlineStartColor: "var(--accent-8)",
          },
        },
        checked: {
          props: {
            borderInlineStartWidth: "var(--border-width-2)",
            borderInlineStartStyle: "solid",
            borderInlineStartColor: "var(--accent-6)",
          },
        },
        indeterminate: {
          props: {
            borderInlineStartWidth: "var(--border-width-2)",
            borderInlineStartStyle: "solid",
            borderInlineStartColor: "var(--accent-6)",
          },
        },
        open: { props: { marginBlockEnd: "var(--space-1)" } },
        closed: { props: { marginBlockEnd: "0" } },
      },
    },
    control: {
      props: {
        display: "flex",
        alignItems: "center",
        gap: "var(--space-2)",
        minHeight: "var(--control-height-sm)",
        paddingInlineEnd: "var(--space-3)",
        borderRadius: "var(--radius-sm)",
        color: "var(--neutral-12)",
        fontWeight: "var(--weight-medium)",
        cursor: "pointer",
        userSelect: "none",
        transition,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        hover: { props: { background: "var(--neutral-4)" } },
        active: { props: { background: "var(--neutral-5)" } },
        selected: { props: selectedFill },
        checked: { props: checkedFill },
        indeterminate: { props: checkedFill },
        focus: { props: focusRing },
        disabled: { props: disabledRow },
        loading: { props: { cursor: "progress", opacity: "0.7" } },
        renaming: { props: { cursor: "text" } },
        open: { props: { background: "var(--neutral-2)" } },
        closed: { props: { background: "transparent" } },
      },
      ancestors: [{ component: "tree-view", part: "item", style: { props: { paddingInlineStart: depthIndent } } }],
    },
    controlIndicator: {
      props: {
        alignItems: "center",
        justifyContent: "center",
        flexShrink: "0",
        color: "var(--neutral-11)",
        transition: "transform var(--motion-fast) var(--ease-out)",
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        open: { props: { display: "inline-flex", transform: "rotate(90deg)" } },
        closed: { props: { display: "inline-flex", transform: "rotate(0deg)" } },
        selected: { props: { display: "inline-flex", color: "var(--accent-10)" } },
        disabled: { props: { opacity: "0.6" } },
        loading: { props: { opacity: "0.6" } },
        focus: { props: { color: "var(--neutral-12)" } },
      },
    },
    content: {
      props: { position: "relative" },
    },
  },
};

export const form: Form = { name: "tree-view-sample", component: "tree-view", recipe };
