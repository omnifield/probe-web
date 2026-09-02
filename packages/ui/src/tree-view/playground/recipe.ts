import type { Form, SlotRecipe } from "@omnifield/probe-web-skin/model";

const transition = "background-color var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out)";

const disabledRow = { color: "var(--neutral-11)", cursor: "not-allowed", opacity: "0.6" };

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
        // Само состояние не меняет вид узла — оно читается через `ancestors` у `control`
        // (см. ниже), где отличает активный лист от активной ветки по цвету текста.
        branch: { props: { display: "flex" } },
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
        hover: { props: { background: "transparent" } },
        active: { props: { background: "transparent" } },
        selected: { props: { fontWeight: "var(--weight-semibold)" } },
        checked: { props: { background: "transparent" } },
        indeterminate: { props: { background: "transparent" } },
        focus: { props: { outline: "none" } },
        disabled: { props: disabledRow },
        loading: { props: { cursor: "progress", opacity: "0.7" } },
        renaming: { props: { cursor: "text" } },
        open: { props: { background: "transparent" } },
        closed: { props: { background: "transparent" } },
      },
      ancestors: [
        { component: "tree-view", part: "item", style: { props: { paddingInlineStart: depthIndent } } },
        // Активный ЛИСТ (нет `data-branch`) — яркий примари. Активная ВЕТКА — правило ниже
        // (два атрибута вместо одного) перекрывает это по специфичности.
        { component: "tree-view", part: "item", states: ["selected"], style: { props: { color: "var(--accent-9)" } } },
        { component: "tree-view", part: "item", states: ["selected", "branch"], style: { props: { color: "var(--accent-12)" } } },
      ],
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
