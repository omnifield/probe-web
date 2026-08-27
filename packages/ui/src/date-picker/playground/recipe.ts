// PROOF RECIPE (`PWEB-111`) — not a shipped product, not product taste. Lives next to the
// component, but is NEVER exported from `index.ts`/`passport.ts`/`kit.ts` — only proves the
// passport CAN be dressed whole by the real skin mechanism (`skinGaps` empty, CSS is generated).
// Same physical shape as every other component's `playground/recipe.ts` (`PWEB-127`).
//
// `positioner` reads `--available-width`/`--available-height` (its OWN measured variables,
// `../entity/passport.ts`), the same select-first pattern the popover's own template names —
// a rule reads a variable only on the part the passport says carries it.

import type { Form, SlotRecipe } from "@omnifield/probe-web-skin/model";

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
  paddingInline: "var(--space-3)",
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
      states: { disabled: { props: { opacity: "0.6" } } },
    },
    label: {
      props: { fontSize: "var(--font-size-md)", fontWeight: "var(--weight-medium)", color: "var(--neutral-12)" },
    },
    control: {
      props: { display: "flex", alignItems: "center", gap: "var(--space-1)" },
    },
    // `input` declares no hover/focus-visible of its own (`../entity/passport.ts`) — only
    // invalid/disabled/readonly/required, all pseudo but "invalid" (a data mark).
    input: {
      props: controlProps(),
      states: {
        invalid: { props: { borderColor: "var(--danger-9)" } },
        disabled: { props: { background: "var(--neutral-3)", color: "var(--neutral-9)", cursor: "not-allowed" } },
        readonly: { props: { background: "var(--neutral-2)" } },
        required: { props: {} },
      },
    },
    // No `disabled` on `clearTrigger` (`../entity/passport.ts`: "no disabled concept in the
    // connector at all") — the kit hides it entirely instead while nothing is selected.
    clearTrigger: {
      props: iconButton,
      states: { hover: iconButtonStates.hover, active: iconButtonStates.active, "focus-visible": iconButtonStates["focus-visible"] },
    },
    // `trigger` declares only open/closed/empty/disabled (`../entity/passport.ts`) — no
    // hover/active/focus-visible, unlike every other real button in this passport.
    trigger: {
      props: iconButton,
      states: { disabled: iconButtonStates.disabled },
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
    },
    positioner: {
      props: {
        maxWidth: "var(--available-width)",
        maxHeight: "var(--available-height)",
      },
    },
    view: {
      props: { display: "flex", flexDirection: "column", gap: "var(--space-2)" },
    },
    viewControl: {
      props: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-2)" },
    },
    viewTrigger: {
      props: {
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-1)",
        paddingInline: "var(--space-2)",
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
      // `viewTrigger` declares only the view axis plus `disabled` (`../entity/passport.ts`) — no
      // hover/focus-visible.
      states: {
        disabled: { props: { opacity: "0.5", cursor: "not-allowed" } },
      },
    },
    rangeText: { props: {} },
    // `prevTrigger`/`nextTrigger` declare ONLY `disabled` (`../entity/passport.ts`) — no
    // hover/active/focus-visible, unlike `clearTrigger`'s own full pseudo trio.
    prevTrigger: { props: iconButton, states: { disabled: iconButtonStates.disabled } },
    nextTrigger: { props: iconButton, states: { disabled: iconButtonStates.disabled } },
    monthSelect: { props: controlSmall(), states: { disabled: { props: { opacity: "0.5" } } } },
    yearSelect: { props: controlSmall(), states: { disabled: { props: { opacity: "0.5" } } } },
    table: { props: { borderCollapse: "collapse" } },
    tableHead: { props: {} },
    tableHeader: {
      props: {
        padding: "var(--space-1)",
        fontSize: "var(--font-size-sm)",
        fontWeight: "var(--weight-medium)",
        color: "var(--neutral-11)",
        textAlign: "center",
      },
    },
    tableBody: { props: {} },
    tableRow: { props: {} },
    tableCell: { props: { padding: "2px", textAlign: "center" } },
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
        "outside-range": { props: { color: "var(--neutral-8)" } },
        unavailable: { props: { color: "var(--neutral-7)", cursor: "not-allowed" } },
        "in-range": { props: { background: "var(--accent-3)", borderRadius: "0" } },
        "in-hover-range": { props: { background: "var(--accent-2)", borderRadius: "0" } },
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
  return { ...controlLook, minBlockSize: "var(--control-height-sm)", paddingInline: "var(--space-2)", fontSize: "var(--font-size-sm)" };
}

/** Form — the "name + component + recipe" record `assemble` accepts. */
export const form: Form = { name: "date-picker-sample", component: "date-picker", recipe };
