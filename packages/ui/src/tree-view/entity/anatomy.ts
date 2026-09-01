// RUNTIME anatomy of the tree view (`ark-ui.com/docs/components/tree-view`) — the largest
// anatomy in the kit after the date picker's.
//
// THIS FILE HOLDS PARTS AND ADDRESSES ONLY — nothing else, the same split as every other
// component's `entity/anatomy.ts`. The fuller runtime contract — per-part STATES, the variant
// axis, SETTINGS — lives one level up, in `passport.ts`. Editor-facing metadata is a further step
// removed, in `playground/index.ts`.
//
// The anatomy arrives ready-made from Ark for FIFTEEN of its sixteen parts — same subpath
// discipline as every Zag-backed component in the kit, physically `@zag-js/tree-view/anatomy`.
//
// `itemContent` is OURS, added with the anatomy builder's own `extendWith(...)` (`@zag-js/
// anatomy`'s real, documented API — checked in its installed `create-anatomy.mjs`: it produces
// `attrs`/`selector` for the extended part by the EXACT SAME `toKebabCase` device native parts
// get, so `partSelector`/skin recipes address it exactly like a native one, no special-casing
// anywhere downstream). Постановка user, 2026-09-01: a leaf's own row (`item`) is never replaced
// by a consumer, only its CONTENT is theirs to decide — same shape the kit already uses for
// accordion's `itemContent`, now real here too, not approximated with a bare, unaddressable
// `extras` node. Ark itself has no such part (a leaf is, natively, just `item`/`itemText`/
// `itemIndicator`) — the split is ours, made real through the same builder Ark's own anatomy is
// built with, not invented alongside it.
//
// SIXTEEN parts now: `root · label · tree · item · itemText · itemIndicator · itemContent ·
// branch · branchControl · branchText · branchIndicator · branchTrigger · branchContent ·
// branchIndentGuide · nodeCheckbox · nodeRenameInput`. A LEAF node draws `item`/`itemText`/
// `itemIndicator`/`itemContent`; a BRANCH node draws `branch`/`branchControl`/`branchText`/
// `branchIndicator`/`branchTrigger`/`branchContent` (wrapping its own children) — the same node
// is never both.
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

/** Fifteen parts taken from Ark, plus our own `itemContent` — real either way, see the file header. */
export const anatomy = treeViewAnatomy.extendWith("itemContent");

/** Part addresses: `attrs` for the node, `selector` for styling. Computed once — they are static. */
export const anatomyParts = anatomy.build();
