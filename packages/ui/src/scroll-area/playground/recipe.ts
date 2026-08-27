// PROOF RECIPE (`PWEB-111`) — not a shipped product, not product taste. Lives next to the
// component, but is NEVER exported from `index.ts`/`passport.ts`/`kit.ts` — only proves the
// passport CAN be dressed whole by the real skin mechanism (`skinGaps` empty, CSS is generated).
// Same physical shape as every other component's `playground/recipe.ts` (`PWEB-127`).
//
// The classic scrollbar grid: `viewport` top-left, vertical `scrollbar` top-right, horizontal
// `scrollbar` bottom-left, `corner` bottom-right — `root` is the grid, everyone else just claims
// a cell. `root` gets a FIXED height so the proof assembly's long text actually overflows;
// nothing here scrolls on an empty box.

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
    },
    viewport: {
      props: { gridColumn: "1 / 2", gridRow: "1 / 2" },
    },
    content: {
      props: {
        padding: "var(--space-3)",
        color: "var(--neutral-12)",
        fontSize: "var(--font-size-md)",
        lineHeight: "var(--leading-relaxed)",
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
      },
    },
  },
};

/** Form — the "name + component + recipe" record `assemble` accepts. */
export const form: Form = { name: "scroll-area-sample", component: "scroll-area", recipe };
