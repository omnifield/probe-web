import type { Form, SlotRecipe } from "@omnifield/probe-web-skin/model";

const transition = "background-color var(--motion-fast) var(--ease-out), box-shadow var(--motion-fast) var(--ease-out)";

export const recipe: SlotRecipe = {
  base: {
    root: {
      props: { display: "flex", flexDirection: "column", gap: "var(--space-2)" },
      states: {
        disabled: { props: { opacity: "0.5" } },
        invalid: { props: { opacity: "1" } },
        dragging: { props: { opacity: "1" } },
        focus: { props: { opacity: "1" } },
      },
    },
    label: {
      props: { fontSize: "var(--font-size-md)", fontWeight: "var(--weight-medium)", color: "var(--neutral-12)" },
      states: {
        disabled: { props: { color: "var(--neutral-11)" } },
        invalid: { props: { color: "var(--danger-11)" } },
        dragging: { props: { color: "var(--neutral-12)" } },
        focus: { props: { color: "var(--neutral-12)" } },
      },
    },
    valueText: {
      props: { fontSize: "var(--font-size-sm)", color: "var(--neutral-11)" },
      states: {
        disabled: { props: { opacity: "0.7" } },
        invalid: { props: { color: "var(--danger-11)" } },
        focus: { props: { color: "var(--neutral-12)" } },
      },
    },
    control: {
      props: {
        position: "relative",
        display: "flex",
        alignItems: "center",
        minBlockSize: "var(--control-height-sm)",
        cursor: "pointer",
      },
      states: {
        disabled: { props: { cursor: "not-allowed" } },
        invalid: { props: { cursor: "pointer" } },
        dragging: { props: { cursor: "grabbing" } },
        focus: { props: { cursor: "pointer" } },
      },
    },
    track: {
      props: {
        position: "relative",
        inlineSize: "100%",
        blockSize: "var(--border-width-2)",
        background: "var(--neutral-5)",
        borderRadius: "var(--radius-full)",
      },
      states: {
        disabled: { props: { background: "var(--neutral-4)" } },
        invalid: { props: { background: "var(--danger-5)" } },
        dragging: { props: { background: "var(--neutral-5)" } },
        focus: { props: { background: "var(--neutral-5)" } },
      },
    },
    range: {
      props: {
        position: "absolute",
        blockSize: "100%",
        background: "var(--accent-9)",
        borderRadius: "var(--radius-full)",
      },
      states: {
        disabled: { props: { background: "var(--neutral-7)" } },
        invalid: { props: { background: "var(--danger-9)" } },
        dragging: { props: { background: "var(--accent-9)" } },
        focus: { props: { background: "var(--accent-9)" } },
      },
    },
    thumb: {
      props: {
        inlineSize: "1.25rem",
        blockSize: "1.25rem",
        borderRadius: "var(--radius-full)",
        background: "var(--neutral-1)",
        borderWidth: "var(--border-width-2)",
        borderStyle: "solid",
        borderColor: "var(--accent-9)",
        boxShadow: "0 1px 2px oklch(0% 0 0 / 0.16)",
        cursor: "grab",
        transition,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        disabled: { props: { borderColor: "var(--neutral-7)", cursor: "not-allowed" } },
        focus: {
          props: {
            outline: "var(--border-width-2) solid var(--accent-8)",
            outlineOffset: "var(--border-width-2)",
          },
        },
        dragging: { props: { cursor: "grabbing", boxShadow: "0 2px 8px oklch(0% 0 0 / 0.24)" } },
        hover: { props: { boxShadow: "0 2px 8px oklch(0% 0 0 / 0.2)" } },
        active: { props: { boxShadow: "0 2px 8px oklch(0% 0 0 / 0.24)" } },
      },
    },
    markerGroup: {
      props: { position: "relative" },
    },
    marker: {
      props: {
        inlineSize: "var(--border-width-2)",
        blockSize: "0.375rem",
        background: "var(--neutral-6)",
      },
      states: {
        disabled: { props: { background: "var(--neutral-5)" } },
        "under-value": { props: { background: "var(--accent-9)" } },
        "at-value": { props: { background: "var(--accent-9)" } },
        "over-value": { props: { background: "var(--neutral-6)" } },
      },
    },
    draggingIndicator: {
      props: {
        marginBlockEnd: "var(--space-2)",
        paddingInline: "var(--space-2)",
        paddingBlock: "var(--space-1)",
        borderRadius: "var(--radius-md)",
        background: "var(--accent-9)",
        color: "var(--accent-contrast)",
        fontSize: "var(--font-size-xs)",
        pointerEvents: "none",
      },
      states: {
        open: { props: { display: "block" } },
        closed: { props: { display: "none" } },
      },
    },
  },
  settings: {
    orientation: {
      vertical: {
        control: { props: { minBlockSize: "unset", minInlineSize: "var(--control-height-sm)", blockSize: "12rem" } },
        track: { props: { inlineSize: "var(--border-width-2)", blockSize: "100%" } },
        range: { props: { inlineSize: "100%", blockSize: "unset" } },
      },
    },
  },
};

export const form: Form = { name: "slider-sample", component: "slider", recipe };
