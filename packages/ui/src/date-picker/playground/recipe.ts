import type { Form, SlotRecipe } from "@web-core/skin/model";

const transition = "background-color var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out), border-color var(--motion-fast) var(--ease-out)";

const iconButton = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minBlockSize: "var(--control-height-md)",
  minInlineSize: "var(--control-height-md)",
  borderWidth: "0",
  borderRadius: "var(--radius-md)",
  background: "var(--neutral-3)",
  color: "var(--neutral-12)",
  fontSize: "var(--font-size-md)",
  cursor: "pointer",
  transition,
  "@media (prefers-reduced-motion: reduce)": { transition: "none" },
} as const;

const iconButtonStates = {
  hover: { props: { background: "var(--neutral-4)" } },
  active: { props: { background: "var(--neutral-5)" } },
  "focus-visible": {
    props: {
      outline: "var(--border-width-2) solid var(--accent-8)",
      outlineOffset: "var(--border-width-2)",
    },
  },
  disabled: { props: { opacity: "0.5", cursor: "not-allowed" } },
} as const;

const controlLook = {
  boxSizing: "border-box",
  minBlockSize: "var(--control-height-md)",
  paddingInline: "var(--space-4)",
  borderWidth: "var(--border-width-1)",
  borderStyle: "solid",
  borderColor: "var(--neutral-7)",
  borderRadius: "var(--radius-md)",
  background: "var(--neutral-1)",
  color: "var(--neutral-12)",
  fontSize: "var(--font-size-md)",
  transition,
  "@media (prefers-reduced-motion: reduce)": { transition: "none" },
} as const;

export const recipe: SlotRecipe = {
  base: {
    root: {
      props: { position: "relative", display: "inline-flex", flexDirection: "column", gap: "var(--space-1)" },
      states: {
        open: { props: { opacity: "1" } },
        closed: { props: { opacity: "1" } },
        disabled: { props: { opacity: "0.6" } },
        readonly: { props: { opacity: "1" } },
        empty: { props: { opacity: "1" } },
      },
    },
    label: {
      props: { fontSize: "var(--font-size-md)", fontWeight: "var(--weight-medium)", color: "var(--neutral-12)" },
      states: {
        open: { props: { opacity: "1" } },
        closed: { props: { opacity: "1" } },
        disabled: { props: { opacity: "0.6" } },
        readonly: { props: { opacity: "1" } },
      },
    },
    control: {
      props: { display: "flex", alignItems: "center", gap: "var(--space-1)" },
      states: {
        disabled: { props: { opacity: "0.6" } },
        empty: { props: { minBlockSize: "var(--control-height-md)" } },
      },
    },
    input: {
      props: controlProps(),
      states: {
        open: { props: { borderColor: "var(--accent-8)" } },
        closed: { props: { borderColor: "var(--neutral-7)" } },
        empty: { props: { color: "var(--neutral-11)" } },
        invalid: { props: { borderColor: "var(--danger-9)" } },
        disabled: { props: { background: "var(--neutral-3)", color: "var(--neutral-11)", cursor: "not-allowed" } },
        readonly: { props: { background: "var(--neutral-2)" } },
        required: { props: { fontWeight: "var(--weight-medium)" } },
      },
    },
    clearTrigger: {
      props: iconButton,
      states: { hover: iconButtonStates.hover, active: iconButtonStates.active, "focus-visible": iconButtonStates["focus-visible"] },
    },
    trigger: {
      props: iconButton,
      states: {
        open: { props: { opacity: "1" } },
        closed: { props: { opacity: "1" } },
        empty: { props: { opacity: "0.8" } },
        disabled: iconButtonStates.disabled,
      },
    },
    content: {
      props: {
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-2)",
        padding: "var(--space-3)",
        background: "var(--neutral-1)",
        borderWidth: "var(--border-width-1)",
        borderStyle: "solid",
        borderColor: "var(--neutral-6)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "0 4px 16px oklch(0% 0 0 / 0.16)",
      },
      states: {
        open: { props: { display: "flex" } },
        closed: { props: { pointerEvents: "none" } },
        inline: { props: { boxShadow: "none" } },
      },
    },
    positioner: {
      props: {
        maxWidth: "var(--available-width)",
        maxHeight: "var(--available-height)",
      },
    },
    view: {
      props: { display: "flex", flexDirection: "column", gap: "var(--space-2)" },
      states: {
        day: { props: { opacity: "1" } },
        month: { props: { opacity: "1" } },
        year: { props: { opacity: "1" } },
      },
    },
    viewControl: {
      props: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-2)" },
      states: {
        day: { props: { opacity: "1" } },
        month: { props: { opacity: "1" } },
        year: { props: { opacity: "1" } },
      },
    },
    viewTrigger: {
      props: {
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-1)",
        paddingInline: "var(--space-3)",
        minBlockSize: "var(--control-height-sm)",
        borderWidth: "0",
        borderRadius: "var(--radius-md)",
        background: "transparent",
        color: "var(--neutral-12)",
        fontWeight: "var(--weight-medium)",
        fontSize: "var(--font-size-md)",
        cursor: "pointer",
        transition,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        day: { props: { opacity: "1" } },
        month: { props: { opacity: "1" } },
        year: { props: { opacity: "1" } },
        disabled: { props: { opacity: "0.5", cursor: "not-allowed" } },
      },
    },
    rangeText: { props: { fontWeight: "var(--weight-medium)" } },
    prevTrigger: { props: iconButton, states: { disabled: iconButtonStates.disabled } },
    nextTrigger: { props: iconButton, states: { disabled: iconButtonStates.disabled } },
    monthSelect: { props: controlSmall(), states: { disabled: { props: { opacity: "0.5" } } } },
    yearSelect: { props: controlSmall(), states: { disabled: { props: { opacity: "0.5" } } } },
    table: {
      props: { borderCollapse: "collapse" },
      states: {
        day: { props: { opacity: "1" } },
        month: { props: { opacity: "1" } },
        year: { props: { opacity: "1" } },
        disabled: { props: { opacity: "0.6" } },
      },
    },
    tableHead: {
      props: { display: "table-header-group" },
      states: {
        day: { props: { opacity: "1" } },
        month: { props: { opacity: "1" } },
        year: { props: { opacity: "1" } },
        disabled: { props: { opacity: "0.6" } },
      },
    },
    tableHeader: {
      props: {
        padding: "var(--space-1)",
        fontSize: "var(--font-size-sm)",
        fontWeight: "var(--weight-medium)",
        color: "var(--neutral-11)",
        textAlign: "center",
      },
      states: {
        day: { props: { opacity: "1" } },
        month: { props: { opacity: "1" } },
        year: { props: { opacity: "1" } },
        disabled: { props: { opacity: "0.6" } },
      },
    },
    tableBody: {
      props: { display: "table-row-group" },
      states: {
        day: { props: { opacity: "1" } },
        month: { props: { opacity: "1" } },
        year: { props: { opacity: "1" } },
        disabled: { props: { opacity: "0.6" } },
      },
    },
    tableRow: {
      props: { display: "table-row" },
      states: {
        day: { props: { opacity: "1" } },
        month: { props: { opacity: "1" } },
        year: { props: { opacity: "1" } },
        disabled: { props: { opacity: "0.6" } },
      },
    },
    tableCell: {
      props: { padding: "2px", textAlign: "center" },
      states: {
        day: { props: { opacity: "1" } },
        month: { props: { opacity: "1" } },
        year: { props: { opacity: "1" } },
        selected: { props: { fontWeight: "var(--weight-medium)" } },
      },
    },
    tableCellTrigger: {
      props: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        inlineSize: "2.25rem",
        blockSize: "2.25rem",
        borderWidth: "0",
        borderRadius: "var(--radius-full)",
        background: "transparent",
        color: "var(--neutral-12)",
        fontSize: "var(--font-size-sm)",
        cursor: "pointer",
        transition,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        today: { props: { borderWidth: "var(--border-width-1)", borderStyle: "solid", borderColor: "var(--accent-8)" } },
        weekend: { props: { color: "var(--neutral-11)" } },
        "outside-range": { props: { color: "var(--neutral-11)" } },
        unavailable: { props: { color: "var(--neutral-11)", cursor: "not-allowed" } },
        "in-range": { props: { background: "var(--accent-3)", borderRadius: "0" } },
        "in-hover-range": { props: { background: "var(--accent-2)", borderRadius: "0" } },
        "hover-range-start": {
          props: {
            background: "var(--accent-2)",
            borderStartStartRadius: "var(--radius-full)",
            borderEndStartRadius: "var(--radius-full)",
          },
        },
        "hover-range-end": {
          props: {
            background: "var(--accent-2)",
            borderStartEndRadius: "var(--radius-full)",
            borderEndEndRadius: "var(--radius-full)",
          },
        },
        "range-start": {
          props: {
            background: "var(--accent-9)",
            color: "var(--accent-contrast)",
            borderStartStartRadius: "var(--radius-full)",
            borderEndStartRadius: "var(--radius-full)",
          },
        },
        "range-end": {
          props: {
            background: "var(--accent-9)",
            color: "var(--accent-contrast)",
            borderStartEndRadius: "var(--radius-full)",
            borderEndEndRadius: "var(--radius-full)",
          },
        },
        selected: { props: { background: "var(--accent-9)", color: "var(--accent-contrast)" } },
        hover: { props: { background: "var(--neutral-4)" } },
        active: { props: { background: "var(--neutral-5)" } },
        "focus-visible": {
          props: {
            outline: "var(--border-width-2) solid var(--accent-8)",
            outlineOffset: "var(--border-width-2)",
          },
        },
        disabled: { props: { opacity: "0.4", cursor: "not-allowed" } },
        day: { props: { borderRadius: "var(--radius-full)" } },
        month: { props: { borderRadius: "var(--radius-md)", inlineSize: "4rem" } },
        year: { props: { borderRadius: "var(--radius-md)", inlineSize: "4rem" } },
        selectable: { props: { cursor: "pointer" } },
        focus: { props: { outline: "none" } },
      },
    },
    presetTrigger: {
      props: {
        display: "inline-flex",
        paddingInline: "var(--space-2)",
        paddingBlock: "var(--space-1)",
        borderWidth: "0",
        borderRadius: "var(--radius-md)",
        background: "var(--neutral-3)",
        color: "var(--neutral-12)",
        fontSize: "var(--font-size-sm)",
        cursor: "pointer",
        transition,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        hover: { props: { background: "var(--neutral-4)" } },
        active: { props: { background: "var(--neutral-5)" } },
        "focus-visible": {
          props: {
            outline: "var(--border-width-2) solid var(--accent-8)",
            outlineOffset: "var(--border-width-2)",
          },
        },
      },
    },
    valueText: {
      props: { color: "var(--neutral-12)", fontSize: "var(--font-size-md)" },
    },
  },
};

/** `input`'s look: the same control base every native control renderer shares, spelled once. */
function controlProps() {
  return { ...controlLook, width: "100%" };
}

/** `monthSelect`/`yearSelect`'s look: the same control base, smaller — they sit inline in `viewControl`. */
function controlSmall() {
  return { ...controlLook, minBlockSize: "var(--control-height-sm)", paddingInline: "var(--space-3)", fontSize: "var(--font-size-sm)" };
}

/** Form — the "name + component + recipe" record `assemble` accepts. */
export const form: Form = { name: "date-picker-sample", component: "date-picker", recipe };
