// PROOF RECIPE (`PWEB-111`) — not a shipped product, not product taste. Lives next to the
// component, but is NEVER exported from `index.ts`/`passport.ts`/`kit.ts` — proves the tree
// view's passport CAN be dressed whole by the real skin mechanism, the same role every other
// component's own recipe plays.
//
// Fifteen parts, the biggest part count in the kit after the date picker's. `item`/`branch` carry
// `--depth` (`../entity/passport.ts`) as an inline custom property; it is NOT repeated on
// `branchControl`/`branchText`/`branchIndicator`/`branchContent`/`branchIndentGuide` below — CSS
// custom properties inherit, and those parts are all DOM descendants of `item`/`branch`, so one
// `calc(var(--depth) * …)` reaches every one of them without a second declaration.
//
// NO HEIGHT ANIMATION on `branchContent` — checked against the INSTALLED `@zag-js/tree-view`
// connector (`1.43.1`), not the ark-ui.com docs' own shared demo CSS (which references a
// `--height` this connector never writes): `getBranchContentProps` only ever toggles the native
// `hidden` attribute. A `hidden` node has no box to transition — the accordion's own "measured
// size" device does not apply here, and inventing an animation over a variable nobody sets would
// be dead code, not restraint.
//
// SELECTION READS AS A SOFT FILL (`accent-3`/`accent-12`), not the solid `accent-9` the checkbox
// uses for "checked": a tree's selection is closer to the date picker's own `in-range` (many rows
// can carry the mark at once, and it needs to stay legible next to plain rows) than to a single
// binary control's own on/off.

import type { Form, SlotRecipe } from "@omnifield/probe-web-skin/model";

/** Look transition — same device as the rest of the kit: different durations on neighbors is a defect. */
const transition = "background-color var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out)";

/** Shared row shape — `item` and `branchControl` are both one clickable, focusable row at some `--depth`. */
const rowProps = {
  display: "flex",
  alignItems: "center",
  gap: "var(--space-2)",
  minHeight: "var(--control-height-sm)",
  paddingInlineStart: "calc(var(--space-3) + var(--depth) * var(--space-6))",
  paddingInlineEnd: "var(--space-3)",
  borderRadius: "var(--radius-sm)",
  color: "var(--neutral-12)",
  cursor: "pointer",
  userSelect: "none",
  transition,
  "@media (prefers-reduced-motion: reduce)": { transition: "none" },
};

/** Shared focus ring — keyed on the explicit `data-focus` attribute, not `:focus-visible`: the
 * connector emits it itself, on both mouse and keyboard arrival (`../entity/passport.ts`). */
const focusRing = {
  outline: "var(--border-width-2) solid var(--accent-8)",
  outlineOffset: "calc(var(--border-width-2) * -1)",
};

/** Shared selection fill — see the file header ("soft fill, not solid"). */
const selectedFill = { background: "var(--accent-3)", color: "var(--accent-12)" };

/** Shared disabledness — a row that cannot be acted on, at any depth. */
const disabledRow = { color: "var(--neutral-11)", cursor: "not-allowed", opacity: "0.6" };

/**
 * TREE VIEW. Fifteen parts, the reading order matches the DOM: a leaf draws `item` alone; a
 * branch draws `branch` wrapping `branchControl` (the row) and `branchContent` (the children).
 */
export const recipe: SlotRecipe = {
  base: {
    root: {
      props: {
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-2)",
        fontSize: "var(--font-size-md)",
        color: "var(--neutral-12)",
      },
    },
    label: {
      props: {
        fontSize: "var(--font-size-sm)",
        fontWeight: "var(--weight-medium)",
        color: "var(--neutral-11)",
      },
    },
    tree: {
      props: { display: "flex", flexDirection: "column" },
    },
    item: {
      props: rowProps,
      states: {
        selected: { props: selectedFill },
        focus: { props: focusRing },
        disabled: { props: disabledRow },
      },
    },
    itemText: {
      props: { flex: "1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
      states: {
        disabled: { props: { color: "var(--neutral-11)" } },
      },
    },
    // `display` NOT IN THE BASE — the kit hides the indicator with `hidden` while the node is not
    // selected (same device as the checkbox's own indicator); an unconditional `display` in the
    // base would show every leaf's mark at once regardless of selection.
    itemIndicator: {
      props: { color: "var(--accent-9)" },
      states: {
        selected: { props: { display: "inline-flex" } },
      },
    },
    branch: {
      props: { display: "flex", flexDirection: "column" },
    },
    branchControl: {
      props: rowProps,
      states: {
        hover: { props: { background: "var(--neutral-4)" } },
        active: { props: { background: "var(--neutral-5)" } },
        focus: { props: focusRing },
        selected: { props: selectedFill },
        disabled: { props: disabledRow },
        loading: { props: { cursor: "progress", opacity: "0.7" } },
      },
    },
    branchText: {
      props: { flex: "1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
      states: {
        disabled: { props: { color: "var(--neutral-11)" } },
        loading: { props: { color: "var(--neutral-11)" } },
      },
    },
    // Rotates on the branch's OWN mark (`data-state`, shared with `branchControl`/`branchText`),
    // same device as the accordion's own indicator.
    branchIndicator: {
      props: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: "0",
        color: "var(--neutral-11)",
        transition: "transform var(--motion-fast) var(--ease-out)",
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        open: { props: { transform: "rotate(90deg)" } },
        disabled: { props: { opacity: "0.6" } },
        loading: { props: { opacity: "0.6" } },
      },
    },
    // A SEPARATE toggle button, for compositions that keep the row itself non-clickable and put
    // expand/collapse on its own control — `role="button"` on a `<div>`, never itself focused
    // (`../entity/passport.ts`).
    branchTrigger: {
      props: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: "0",
        color: "var(--neutral-11)",
        cursor: "pointer",
      },
      states: {
        hover: { props: { color: "var(--neutral-12)" } },
        active: { props: { color: "var(--neutral-12)" } },
        disabled: { props: { cursor: "not-allowed", opacity: "0.5" } },
        loading: { props: { cursor: "progress" } },
      },
    },
    // NO ANIMATION, NO MEASURED SIZE — see the file header. `position: relative` only, so
    // `branchIndentGuide` (absolutely positioned) has something to measure against.
    branchContent: {
      props: { display: "flex", flexDirection: "column", position: "relative" },
    },
    // A vertical guide at the child's OWN depth — reads `--depth` inherited from the `branch` it
    // sits inside (same inheritance the file header names), offset to land under the row's icon.
    branchIndentGuide: {
      props: {
        position: "absolute",
        insetBlockStart: "0",
        insetBlockEnd: "0",
        insetInlineStart: "calc(var(--space-3) + var(--depth) * var(--space-6) + var(--space-2))",
        width: "var(--border-width-1)",
        background: "var(--neutral-6)",
      },
    },
    // Same square the checkbox's own `control` uses (`../../checkbox/playground/recipe.ts`) —
    // one glyph size for "a checkbox" across the kit, not a second size invented here.
    nodeCheckbox: {
      props: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: "0",
        width: "var(--control-height-sm)",
        height: "var(--control-height-sm)",
        borderRadius: "var(--radius-sm)",
        borderWidth: "var(--border-width-1)",
        borderStyle: "solid",
        borderColor: "var(--neutral-7)",
        background: "var(--neutral-1)",
        color: "var(--accent-contrast)",
        cursor: "pointer",
        transition,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        checked: { props: { borderColor: "var(--accent-9)", background: "var(--accent-9)" } },
        indeterminate: { props: { borderColor: "var(--accent-9)", background: "var(--accent-9)" } },
        hover: { props: { borderColor: "var(--accent-8)" } },
        disabled: { props: { borderColor: "var(--neutral-6)", background: "var(--neutral-3)" } },
      },
    },
    // A real `<input>` that REPLACES the row's text while renaming — same width as the text it
    // covers, no border games: it should read as "this text is now editable", not a new control.
    nodeRenameInput: {
      props: {
        flex: "1",
        minWidth: "0",
        font: "inherit",
        color: "inherit",
        background: "var(--neutral-1)",
        border: "var(--border-width-1) solid var(--accent-8)",
        borderRadius: "var(--radius-sm)",
        paddingInline: "var(--space-1)",
      },
    },
  },
};

/** Form — the "name + component + recipe" record `assemble` accepts. */
export const form: Form = { name: "tree-view-sample", component: "tree-view", recipe };
