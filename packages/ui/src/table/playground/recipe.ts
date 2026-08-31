// PROOF RECIPE (`PWEB-111`) — not a shipped product, not product taste. Lives next to the
// component, but is NEVER exported from `index.ts`/`passport.ts`/`kit.ts` — only proves the
// passport CAN be dressed whole by the real skin mechanism (`skinGaps` empty, CSS is generated).
// Same physical shape as every other component's `playground/recipe.ts` (`PWEB-127`).

import type { Form, SlotRecipe } from "@omnifield/probe-web-skin/model";

const sortColor = "color var(--motion-fast) var(--ease-out)";

export const recipe: SlotRecipe = {
  base: {
    root: {
      props: {
        width: "100%",
        borderCollapse: "collapse",
        fontSize: "var(--font-size-md)",
        color: "var(--neutral-12)",
      },
    },
    caption: {
      props: {
        captionSide: "top",
        textAlign: "start",
        paddingBlock: "var(--space-2)",
        color: "var(--neutral-11)",
        fontSize: "var(--font-size-sm)",
      },
    },
    head: { props: {} },
    headRow: { props: {} },
    headerCell: {
      props: {
        textAlign: "start",
        paddingInline: "var(--space-3)",
        paddingBlock: "var(--space-2)",
        borderBlockEnd: "var(--border-width-2) solid var(--neutral-6)",
        fontWeight: "var(--weight-medium)",
        fontSize: "var(--font-size-sm)",
        color: "var(--neutral-11)",
      },
    },
    headerSortTrigger: {
      props: {
        display: "inline-flex",
        alignItems: "center",
        // `control-inline-gap` (`space-2`) — иконка↔подпись внутри одного контрола, тот же зазор,
        // что у кнопки/чекбокса/свитча. Был `space-1` без причины — разъезд найден и починен PWEB-198.
        gap: "var(--space-2)",
        borderWidth: "0",
        padding: "0",
        background: "transparent",
        font: "inherit",
        color: "inherit",
        cursor: "pointer",
        transition: sortColor,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        ascending: { props: { color: "var(--accent-11)" } },
        descending: { props: { color: "var(--accent-11)" } },
        hover: { props: { color: "var(--neutral-12)" } },
        "focus-visible": {
          props: {
            outline: "var(--border-width-2) solid var(--accent-8)",
            outlineOffset: "var(--space-1)",
          },
        },
        disabled: { props: { cursor: "default" } },
      },
    },
    body: { props: {} },
    row: { props: {} },
    cell: {
      props: {
        paddingInline: "var(--space-3)",
        paddingBlock: "var(--space-2)",
        borderBlockEnd: "var(--border-width-1) solid var(--neutral-4)",
      },
    },
  },
};

/** Form — the "name + component + recipe" record `assemble` accepts. */
export const form: Form = { name: "table-sample", component: "table", recipe };
