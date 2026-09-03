import type { Form, SlotRecipe } from "@omnifield/probe-web-skin/model";

const transition = "background-color var(--motion-fast) var(--ease-out)";

export const recipe: SlotRecipe = {
  base: {
    root: {
      props: {
        position: "relative",
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gridTemplateRows: "1fr auto",
        height: "12rem",
        overflow: "hidden",
        borderWidth: "var(--border-width-1)",
        borderStyle: "solid",
        borderColor: "var(--neutral-6)",
        borderRadius: "var(--radius-lg)",
        background: "var(--neutral-1)",
      },
      states: {
        "overflow-x": { props: { overscrollBehaviorX: "contain" } },
        "overflow-y": { props: { overscrollBehaviorY: "contain" } },
      },
    },
    viewport: {
      props: { gridColumn: "1 / 2", gridRow: "1 / 2" },
      states: {
        "overflow-x": { props: { overscrollBehaviorX: "contain" } },
        "overflow-y": { props: { overscrollBehaviorY: "contain" } },
        "at-top": { props: { scrollPaddingBlockStart: "0" } },
        "at-bottom": { props: { scrollPaddingBlockEnd: "0" } },
        "at-left": { props: { scrollPaddingInlineStart: "0" } },
        "at-right": { props: { scrollPaddingInlineEnd: "0" } },
      },
    },
    content: {
      props: {
        padding: "var(--space-3)",
        color: "var(--neutral-12)",
        fontSize: "var(--font-size-md)",
        lineHeight: "var(--leading-relaxed)",
      },
      states: {
        "overflow-x": { props: { willChange: "scroll-position" } },
        "overflow-y": { props: { willChange: "scroll-position" } },
      },
    },
    scrollbar: {
      props: {
        display: "flex",
        padding: "2px",
        background: "var(--neutral-2)",
        transition,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        vertical: { props: { gridColumn: "2 / 3", gridRow: "1 / 2", width: "0.75rem", flexDirection: "column" } },
        horizontal: { props: { gridColumn: "1 / 2", gridRow: "2 / 3", height: "0.75rem", flexDirection: "row" } },
        "overflow-x": { props: { pointerEvents: "auto" } },
        "overflow-y": { props: { pointerEvents: "auto" } },
        hover: { props: { background: "var(--neutral-3)" } },
        dragging: { props: { background: "var(--neutral-4)" } },
        scrolling: { props: { opacity: "1" } },
      },
    },
    thumb: {
      props: {
        flex: "1",
        borderRadius: "var(--radius-full)",
        background: "var(--neutral-7)",
        transition,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        vertical: { props: { minHeight: "1.5rem" } },
        horizontal: { props: { minWidth: "1.5rem" } },
        hover: { props: { background: "var(--neutral-8)" } },
        dragging: { props: { background: "var(--neutral-9)" } },
      },
    },
    corner: {
      props: {
        gridColumn: "2 / 3",
        gridRow: "2 / 3",
        background: "var(--neutral-2)",
      },
      states: {
        hidden: { props: { display: "none" } },
        visible: { props: { display: "block" } },
        "overflow-x": { props: { pointerEvents: "none" } },
        "overflow-y": { props: { pointerEvents: "none" } },
        hover: { props: { background: "var(--neutral-3)" } },
      },
    },
  },
};

export const form: Form = { name: "scroll-area-sample", component: "scroll-area", recipe };
