// PROOF RECIPE (`PWEB-111`) — not a shipped product, not product taste. Lives next to the
// component, but is NEVER exported from `index.ts`/`passport.ts`/`kit.ts` — proves the tree
// view's passport CAN be dressed whole by the real skin mechanism, the same role every other
// component's own recipe plays.
//
// Sixteen parts, the biggest part count in the kit. `item`/`branch` carry
// `--depth` (`../entity/passport.ts`) as an inline custom property. `branchControl`/
// `branchIndentGuide` need it too but do NOT own it — this file's own test
// (`../test/tree-view.test.tsx`) caught both as `variable-elsewhere`: the mechanic does not take
// implicit CSS inheritance across parts on faith, even where it genuinely resolves correctly at
// runtime — a rule addressing a variable it does not own must say so, through `ancestors`, or the
// mechanic cannot tell "reads a real ancestor's variable" apart from "typo, will land unresolved".
// (`growAncestor`, `packages/skin/src/rules/traverse/local.ts`, had its own gap here — fixed
// separately, before this file was written, once a different draft found the same class of bug.)
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

/**
 * Shared row shape — `item` and `branchControl` are both one clickable, focusable row at some
 * `--depth`. The indent itself is NOT here: `item` owns `--depth` and takes it directly in its
 * own `props` (below); `branchControl` does not own it and reaches `branch`'s through `ancestors`
 * instead (see the file header — a bare `var(--depth)` here read as `variable-elsewhere`, proven
 * by this file's own test).
 */
const rowProps = {
  display: "flex",
  alignItems: "center",
  gap: "var(--space-2)",
  minHeight: "var(--control-height-sm)",
  paddingInlineEnd: "var(--space-3)",
  borderRadius: "var(--radius-sm)",
  color: "var(--neutral-12)",
  cursor: "pointer",
  userSelect: "none",
  transition,
  "@media (prefers-reduced-motion: reduce)": { transition: "none" },
};

/**
 * The indent formula, shared by every row/guide that reads `--depth` — `item` owns it and takes
 * it directly; `branchControl`/`branchIndentGuide` reach it through `ancestors` (see the file
 * header) since neither owns it itself.
 */
const depthIndent = "calc(var(--space-3) + var(--depth) * var(--space-6))";

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

/** Shared checkbox-mark tint — softer than `selectedFill`, so a checked-and-selected row still tells them apart. */
const checkedFill = { background: "var(--accent-2)" };

/**
 * TREE VIEW. Sixteen parts, the reading order matches the DOM: a leaf draws `item` (plus
 * `itemContent`, its own open slot); a branch draws `branch` wrapping `branchControl` (the row)
 * and `branchContent` (the children).
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
      props: { ...rowProps, paddingInlineStart: depthIndent },
      states: {
        selected: { props: selectedFill },
        // Checked/indeterminate get their OWN, softer tint (`checkedFill`) — the mark itself lives
        // on `nodeCheckbox`, this is only a light "this row carries a mark" cue on the row itself.
        checked: { props: checkedFill },
        indeterminate: { props: checkedFill },
        focus: { props: focusRing },
        disabled: { props: disabledRow },
        // Clicking a renaming row edits text, not selection — the row's own cursor says so.
        renaming: { props: { cursor: "text" } },
      },
    },
    itemText: {
      props: { flex: "1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
      states: {
        disabled: { props: { color: "var(--neutral-11)" } },
        // Selected reads slightly bolder — `item`'s own fill already carries the color contrast,
        // this is the text's own share of "this row is picked out from its neighbors".
        selected: { props: { fontWeight: "var(--weight-medium)" } },
        focus: { props: { color: "var(--neutral-12)" } },
      },
    },
    // `display` NOT IN THE BASE — the kit hides the indicator with `hidden` while the node is not
    // selected (same device as the checkbox's own indicator); an unconditional `display` in the
    // base would show every leaf's mark at once regardless of selection.
    itemIndicator: {
      props: { color: "var(--accent-9)" },
      states: {
        selected: { props: { display: "inline-flex" } },
        disabled: { props: { opacity: "0.5" } },
        focus: { props: { color: "var(--accent-10)" } },
      },
    },
    // Ours, not Ark's (`entity/anatomy.ts`'s `extendWith`) — an open slot, no look of its own by
    // definition (`../parts.ts`'s own `means`). `display: contents` says that honestly: the node
    // exists for addressing, not for a box — whatever a consumer puts inside lays out as if it
    // sat directly in `item`, not behind an extra wrapper it never asked for.
    itemContent: {
      props: { display: "contents" },
    },
    branch: {
      props: { display: "flex", flexDirection: "column" },
      states: {
        // Functional, not visual — `branchControl` (its child, the actual row) already carries
        // the disabled/loading LOOK; opacity on both would compound to an over-faint result, so
        // the wrapper only stops clicks from reaching a subtree it has no business accepting.
        disabled: { props: { pointerEvents: "none" } },
        loading: { props: { pointerEvents: "none" } },
        // An accent edge on the WHOLE selected subtree — distinct from `branchControl`'s own row
        // fill, the same "this branch, not just its header row, is picked out" cue `branchText`'s
        // own weight change and `branchIndicator`'s own tint echo below.
        selected: {
          props: {
            borderInlineStartWidth: "var(--border-width-2)",
            borderInlineStartStyle: "solid",
            borderInlineStartColor: "var(--accent-8)",
          },
        },
        // Real, if small: a touch of breathing room below an expanded branch's own content, gone
        // once it collapses back — an explicit counterpart, not an assumed default.
        open: { props: { marginBlockEnd: "var(--space-1)" } },
        closed: { props: { marginBlockEnd: "0" } },
      },
    },
    branchControl: {
      props: rowProps,
      states: {
        hover: { props: { background: "var(--neutral-4)" } },
        active: { props: { background: "var(--neutral-5)" } },
        focus: { props: focusRing },
        selected: { props: selectedFill },
        checked: { props: checkedFill },
        indeterminate: { props: checkedFill },
        disabled: { props: disabledRow },
        loading: { props: { cursor: "progress", opacity: "0.7" } },
        renaming: { props: { cursor: "text" } },
        // A faint tint while expanded — explicit counterpart below, not an assumed "nothing" default.
        open: { props: { background: "var(--neutral-2)" } },
        closed: { props: { background: "transparent" } },
      },
      // `branchControl` does not own `--depth` — `branch` does. Reached through `ancestors`, not
      // a bare reference in `props` (see the file header).
      ancestors: [{ component: "tree-view", part: "branch", style: { props: { paddingInlineStart: depthIndent } } }],
    },
    branchText: {
      props: { flex: "1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
      states: {
        disabled: { props: { color: "var(--neutral-11)" } },
        loading: { props: { color: "var(--neutral-11)" } },
        // The expanded branch's own label reads slightly bolder — same device as `itemText`'s
        // own "selected reads bolder" above, applied to this part's own open/closed axis instead.
        open: { props: { fontWeight: "var(--weight-medium)" } },
        closed: { props: { fontWeight: "var(--weight-normal)" } },
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
        // Explicit counterpart to `open`'s rotation, not an assumed default — the base declares
        // no `transform` of its own to fall back to.
        closed: { props: { transform: "rotate(0deg)" } },
        disabled: { props: { opacity: "0.6" } },
        loading: { props: { opacity: "0.6" } },
        selected: { props: { color: "var(--accent-10)" } },
        focus: { props: { color: "var(--neutral-12)" } },
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
        // Tints while the branch it toggles is expanded — explicit counterpart below, matching
        // `branchIndicator`'s own open/closed pair rather than inventing a second rotation device
        // on a button that is not itself declared to be a graphic (`../entity/passport.ts`).
        open: { props: { color: "var(--accent-9)" } },
        closed: { props: { color: "var(--neutral-11)" } },
      },
    },
    // NO ANIMATION, NO MEASURED SIZE — see the file header. `position: relative` only, so
    // `branchIndentGuide` (absolutely positioned) has something to measure against.
    branchContent: {
      props: { display: "flex", flexDirection: "column", position: "relative" },
      states: {
        // A touch of breathing room from the trigger row above, once the content is actually
        // showing — explicit counterpart below, not an assumed default.
        open: { props: { paddingBlockStart: "var(--space-1)" } },
        closed: { props: { paddingBlockStart: "0" } },
      },
    },
    // A vertical guide at the child's OWN depth, offset to land under the row's icon. Does not own
    // `--depth` — reached through `ancestors` (`branch`, see the file header), a level further up
    // than `branchControl`'s own but the same mechanism: the generated selector is a descendant
    // selector regardless of how many real DOM levels sit between them.
    branchIndentGuide: {
      props: {
        position: "absolute",
        insetBlockStart: "0",
        insetBlockEnd: "0",
        width: "var(--border-width-1)",
        background: "var(--neutral-6)",
      },
      ancestors: [
        {
          component: "tree-view",
          part: "branch",
          style: { props: { insetInlineStart: "calc(var(--depth) * var(--space-6) + var(--space-3) + var(--space-2))" } },
        },
      ],
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
        // Explicit resting look — same values the base already carries, restated as its own
        // named state rather than left as an assumed default (`data-state="unchecked"` is a real,
        // separate mark the connector writes, not merely the absence of `checked`).
        unchecked: { props: { borderColor: "var(--neutral-7)", background: "var(--neutral-1)" } },
        hover: { props: { borderColor: "var(--accent-8)" } },
        active: { props: { borderColor: "var(--accent-9)" } },
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
