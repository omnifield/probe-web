// RUNTIME anatomy of the tree view (`ark-ui.com/docs/components/tree-view`) — the largest
// anatomy in the kit after the date picker's.
//
// THIS FILE HOLDS PARTS AND ADDRESSES ONLY — nothing else, the same split as every other
// component's `entity/anatomy.ts`. The fuller runtime contract — per-part STATES, the variant
// axis, SETTINGS — lives one level up, in `passport.ts`. Editor-facing metadata is a further step
// removed, in `playground/index.ts`.
//
// The anatomy is NOT declared here: it arrives ready-made, the same reason and the same subpath
// discipline as every Zag-backed component in the kit. It physically lives in
// `@zag-js/tree-view/anatomy`; Ark's own `treeViewAnatomy` is the SAME object, re-exported
// straight from `@zag-js/tree-view` — checked in the installed chunk
// (`src/components/tree-view/tree-view.anatomy.ts` does nothing but
// `export { anatomy } from "@zag-js/tree-view"`), no `.extendWith(...)`.
//
// FIFTEEN parts: `root · label · tree · item · itemText · itemIndicator · branch ·
// branchControl · branchText · branchIndicator · branchTrigger · branchContent ·
// branchIndentGuide · nodeCheckbox · nodeRenameInput`. A LEAF node draws `item`/`itemText`/
// `itemIndicator`; a BRANCH node draws `branch`/`branchControl`/`branchText`/`branchIndicator`/
// `branchTrigger`/`branchContent` (wrapping its own children) — the same node is never both.
//
// TWO MORE Solid components ship alongside this component with NO anatomy address of their own:
// `TreeViewNodeProvider` (a pure context wrapper — `node`/`indexPath` in, no DOM node out, needed
// so every part inside it can read which tree node it belongs to) and
// `TreeViewNodeCheckboxIndicator` (a pure conditional-rendering helper — returns one of
// `children`/`indeterminate`/`fallback` depending on the node's own checked state, no DOM node of
// its own either, checked directly in the installed chunk). Both are wrapped in
// `../components/index.tsx` for a working composition, neither gets a passport entry — the same
// "no address, no part" rule the checkbox's own hidden input already follows.

import { anatomy as treeViewAnatomy } from "@zag-js/tree-view/anatomy";

/** Parts and addresses — taken, not ours. Fifteen, and the map below covers them all. */
export const anatomy = treeViewAnatomy;

/** Part addresses: `attrs` for the node, `selector` for styling. Computed once — they are static. */
export const anatomyParts = anatomy.build();
