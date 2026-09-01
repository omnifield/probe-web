// RUNTIME anatomy of the tree view (`ark-ui.com/docs/components/tree-view`) — the largest
// anatomy in the kit after the date picker's.
//
// THIS FILE HOLDS PARTS AND ADDRESSES ONLY — nothing else, the same split as every other
// component's `entity/anatomy.ts`. The fuller runtime contract — per-part STATES, the variant
// axis, SETTINGS — lives one level up, in `passport.ts`. Editor-facing metadata is a further step
// removed, in `playground/index.ts`.
//
// The anatomy arrives ready-made from Ark for FIFTEEN of its seventeen parts — same subpath
// discipline as every Zag-backed component in the kit, physically `@zag-js/tree-view/anatomy`.
//
// `itemContent`/`itemTrigger` are OURS, added with the anatomy builder's own `extendWith(...)`
// (`@zag-js/anatomy`'s real, documented API — checked in its installed `create-anatomy.mjs`: it
// produces `attrs`/`selector` for an extended part by the EXACT SAME `toKebabCase` device native
// parts get, so `partSelector`/skin recipes address it exactly like a native one, no
// special-casing anywhere downstream; the actual `<div>` each renders comes from `../../shared/
// own-part.js`, the shared template for a kit-invented part with no Ark connector behind it).
//
// Постановка user, 2026-09-01, following the SAME recursion accordion's own `item`/`branch` share
// (a `branch` is a disclosure node: a header always shown, a body that may hide or recurse; a
// leaf is that recursion's BASE CASE — nothing to disclose, but still its own clickable identity,
// same as the header). So a LEAF mirrors a BRANCH part for part: `itemTrigger` (header — label +
// indicator, mirrors `branchControl`) sits inside `item` (mirrors `branch`) alongside
// `itemContent` (an always-visible open slot, mirrors `branchContent`'s ROLE without its
// recursion — a leaf has nothing further to nest). `item` itself is never replaced by a consumer,
// only what's inside `itemTrigger`/`itemContent` is theirs to decide. Ark itself has no such
// split for a leaf (natively just `item`/`itemText`/`itemIndicator`) — it is ours, made real
// through the same builder Ark's own anatomy is built with, not invented alongside it.
//
// SEVENTEEN parts now: `root · label · tree · item · itemTrigger · itemText · itemIndicator ·
// itemContent · branch · branchControl · branchText · branchIndicator · branchTrigger ·
// branchContent · branchIndentGuide · nodeCheckbox · nodeRenameInput`. A LEAF node draws
// `item`/`itemTrigger`/`itemText`/`itemIndicator`/`itemContent`; a BRANCH node draws
// `branch`/`branchControl`/`branchText`/`branchIndicator`/`branchTrigger`/`branchContent`
// (wrapping its own children) — the same node is never both.
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

/** Fifteen parts taken from Ark, plus our own `itemContent`/`itemTrigger` — real either way, see the file header. */
export const anatomy = treeViewAnatomy.extendWith("itemContent", "itemTrigger");

/** Part addresses: `attrs` for the node, `selector` for styling. Computed once — they are static. */
export const anatomyParts = anatomy.build();
