// RUNTIME passport of the tree view — anatomy (`anatomy.ts`) plus everything else the running
// app needs: per-part STATES, tied together by `definePassport`.
//
// THIS FILE IS RUNTIME ONLY, same as the anatomy it builds on — it ships in the app bundle.
// Editor-facing metadata lives in `playground/index.ts` instead; that file depends on this one,
// never the other way.
//
// Every mark below was read from `@zag-js/tree-view/tree-view.connect.mjs` (474 lines, read in
// full — the second-largest connector in the kit, after the date picker's), the same rigor the
// rest of the kit's passports read from a `.connect.mjs`.
//
// ## `item`/`branchControl` mark checked/indeterminate as TWO INDEPENDENT booleans; `nodeCheckbox`
// marks the SAME fact as one three-valued attribute — a real inconsistency inside this one connector
//
// `getItemProps`/`getBranchControlProps` write `"data-checked": dataAttr(checked === true)` and
// `"data-indeterminate": dataAttr(checked === "indeterminate")` — TWO separate presence-only
// attributes, NEITHER of which appears when the node is plain unchecked (both simply absent).
// `getNodeCheckboxProps`, addressing the SAME underlying fact for the SAME node, instead writes
// ONE `data-state` with three literal values (`"checked"`/`"unchecked"`/`"indeterminate"`) — the
// checkbox's own convention. Declared as two genuinely different shapes below, not normalized to
// match each other: normalizing would assert a `data-*` attribute this connector never actually
// writes.
//
// ## `--depth` is written on `item`/`branch` only; `data-depth` (the ATTRIBUTE) is EXCLUDED everywhere
//
// Both `item` and `branch` carry `style: { "--depth": nodeState.depth }` — declared as a
// `PassportVariable` on each. The separate `data-depth` ATTRIBUTE (present on `item`/`branch`/
// `branchContent`/`branchIndentGuide` too) is identity/positional data, not a look — the same
// category as `data-value`/`data-path`/`data-ownedby`, all excluded — and, being an unbounded
// integer with no fixed set of values, could not be enumerated as named `PassportState`s even if
// it were a look, the slider's own `--slider-thumb-offset-N` limitation applies the same way here.
//
// ## `branchTrigger`'s native `disabled` mirrors LOADING, not the node's own `disabled` flag
//
// `getBranchTriggerProps` sets `disabled: nodeState.loading` (native attribute) alongside its OWN
// separate, explicit `"data-disabled": dataAttr(nodeState.disabled)` — two DIFFERENT concepts
// sharing similarly-named marks on the SAME node. `data-disabled` is declared (the explicit,
// intentional mark); the native `disabled` is not treated as a `:disabled` pseudo source, because
// what it actually reflects is `loading` — already declared under its own honest name.
//
// ## `branchTrigger`/`branchControl` are `role="button"` on a `<div>`, not a real `<button>` — but
// still genuinely hoverable/pressable
//
// Neither tracks pointer position in JS (no `onPointerMove`/`onPointerLeave` on either) — the
// date picker's own `tableCellTrigger`/the drawer's own `grabber` reasoning applies unchanged:
// `:hover`/`:active` are honest pseudo-classes regardless of tag. `branchControl` alone gets real
// `tabIndex`/`onFocus` (roving, one focusable row per tree) — `:focus-visible` is NOT declared
// alongside its own explicit `data-focus`, the tabs' trigger's own rule (the mark that is
// explicitly emitted is the one declared). `branchTrigger` itself is never `tabIndex`-managed —
// no keyboard focus ever lands on it directly, so no focus-visible pseudo is offered there either.
//
// ## `nodeCheckbox` is never itself keyboard-focusable (`tabIndex: -1`, unconditionally)
//
// Real click handling, but no `:focus-visible` — focus always stays on the row
// (`item`/`branchControl`), the checkbox glyph is a mouse/click-only affordance layered on top.
//
// ## `nodeRenameInput` carries no mark of its own beyond native `hidden` — which mirrors `renaming`,
// already declared on `item`/`branchControl`
//
// Native `hidden` here is not a look a skin picks — the state that actually drives it
// (`renaming`) already has its own address, on the row that OWNS the rename UI, the same
// "point at where the fact actually lives" the checkbox's own indicator/hidden exclusion follows.

import { defineSettings, definePassport, type PassportState } from "@omnifield/probe-web-skin/model";
// TYPE ONLY: `import type` is erased at build time entirely, and the `./passport` subpath stays
// what it is sold as — data with no Solid. Needed only so the setting keys are checked against
// the component's real props. `TreeNode` stands in for the collection's own node type: the
// passport does not care what shape a consumer's tree data takes.
import type { TreeNode, TreeViewProps } from "../components/index.js";
import { anatomy } from "./anatomy.js";

/** Real DOM/keyboard/pointer focus target — explicit, mirrored where the node itself is not focusable. */
const focus = { name: "focus", mark: { kind: "attribute", name: "data-focus" } } as const satisfies PassportState;
/** This node is part of the current selection. */
const selected = { name: "selected", mark: { kind: "attribute", name: "data-selected" } } as const satisfies PassportState;
/** This node cannot be interacted with. */
const disabled = { name: "disabled", mark: { kind: "attribute", name: "data-disabled" } } as const satisfies PassportState;
/** This node's label is being edited right now (`F2`, or `startRenaming(value)`). */
const renaming = { name: "renaming", mark: { kind: "attribute", name: "data-renaming" } } as const satisfies PassportState;
/** Present only when fully checked — see the file header ("two independent booleans"). */
const checked = { name: "checked", mark: { kind: "attribute", name: "data-checked" } } as const satisfies PassportState;
/** Present only when SOME, not all, descendants are checked — the other of the same pair. */
const indeterminate = { name: "indeterminate", mark: { kind: "attribute", name: "data-indeterminate" } } as const satisfies PassportState;
/** A branch is fetching its own children (`loadChildren`) — leaf parts never carry this. */
const loading = { name: "loading", mark: { kind: "attribute", name: "data-loading" } } as const satisfies PassportState;
/** A branch is expanded. */
const open = { name: "open", mark: { kind: "attribute", name: "data-state", value: "open" } } as const satisfies PassportState;
/** A branch is collapsed — the same attribute, the other value. */
const closed = { name: "closed", mark: { kind: "attribute", name: "data-state", value: "closed" } } as const satisfies PassportState;
const openClosed: readonly PassportState[] = [open, closed];

/** A genuine, hoverable/pressable surface with no JS-tracked pointer state — see the file header. */
const hoverActivePseudos: readonly PassportState[] = [
  { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
  { name: "active", mark: { kind: "pseudo", name: ":active" } },
];

/** Passport of the tree view — anatomy plus what anatomy alone does not say. */
export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    { name: "root", states: [] },
    { name: "label", states: [] },
    { name: "tree", states: [] },
    {
      name: "item",
      states: [focus, selected, disabled, renaming, checked, indeterminate],
      variables: [{ name: "--depth", setBy: "kit" }],
    },
    { name: "itemText", states: [disabled, selected, focus] },
    { name: "itemIndicator", states: [disabled, selected, focus] },
    // Наша часть (`entity/anatomy.ts`'s `extendWith`), не Ark — своих состояний не несёт, ровно
    // как и `tree` выше: место под содержимое потребителя, у него нет собственного вида.
    { name: "itemContent", states: [] },
    {
      name: "branch",
      states: [selected, disabled, loading, ...openClosed],
      variables: [{ name: "--depth", setBy: "kit" }],
    },
    {
      name: "branchControl",
      states: [...openClosed, disabled, selected, focus, renaming, checked, indeterminate, loading, ...hoverActivePseudos],
    },
    { name: "branchText", states: [...openClosed, disabled, loading] },
    { name: "branchIndicator", states: [...openClosed, disabled, selected, focus, loading] },
    { name: "branchTrigger", states: [...openClosed, disabled, loading, ...hoverActivePseudos] },
    { name: "branchContent", states: openClosed },
    { name: "branchIndentGuide", states: [] },
    { name: "nodeCheckbox", states: [{ name: "checked", mark: { kind: "attribute", name: "data-state", value: "checked" } }, { name: "unchecked", mark: { kind: "attribute", name: "data-state", value: "unchecked" } }, { name: "indeterminate", mark: { kind: "attribute", name: "data-state", value: "indeterminate" } }, disabled, ...hoverActivePseudos] },
    { name: "nodeRenameInput", states: [] },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  // NO settings from the closed vocabulary apply: `selectionMode`/`expandOnClick`/`typeahead` are
  // all real props, but none is `orientation`/`multiple`/`collapsible` — the same empty result
  // the dialog's/drawer's own settings already show.
  settings: defineSettings<TreeViewProps<TreeNode>>()({}),
});
