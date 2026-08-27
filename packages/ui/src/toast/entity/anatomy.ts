// RUNTIME anatomy of the toast (`ark-ui.com/docs/components/toast`) — the kit's only component
// backed by TWO zag machines at once, not one.
//
// THIS FILE HOLDS PARTS AND ADDRESSES ONLY — nothing else, the same split as every other
// component's `entity/anatomy.ts`. The fuller runtime contract — per-part STATES, the variant
// axis, SETTINGS — lives one level up, in `passport.ts`. Editor-facing metadata is a further step
// removed, in `playground/index.ts`.
//
// The anatomy is NOT declared here: it arrives ready-made, the same reason and the same subpath
// discipline as every Zag-backed component in the kit. It physically lives in
// `@zag-js/toast/anatomy`; Ark's own `toastAnatomy` is the SAME object, re-exported straight from
// `@zag-js/toast` — checked in the installed chunk (`src/components/toast/toast.anatomy.ts` does
// nothing but `export { anatomy } from "@zag-js/toast"`), no `.extendWith(...)`.
//
// SIX parts: `group · root · title · description · actionTrigger · closeTrigger`. `group` is the
// REGION holding every toast at once (`toast-group.machine`/`toast-group.connect.mjs` — a
// singleton STORE, created once via `createToaster(...)`, not a per-instance prop the way every
// other component's config is); `root` is ONE toast's own wrapper (`toast.machine`/
// `toast.connect.mjs` — one live instance PER toast, spun up automatically for each entry the
// store holds). Both marks appear on real, separately-addressable nodes; the split is not a
// choice this passport makes, it is how the two machines actually divide the work.
//
// `root` renders TWO extra "ghost" nodes internally (`getGhostBeforeProps`/`getGhostAfterProps` —
// checked in `toast.connect.mjs`: pure hover-tracking helpers that keep a toast's own hover state
// stable while it slides past a sibling) — NEITHER carries an anatomy address (no
// `...parts.X.attrs` in either), and Ark's own `ToastRoot` bakes them in as fixed, unaddressable
// children, not something a consumer arranges — `../components/index.tsx`'s own `ToastRoot`
// wrapper gets them "for free" by wrapping Ark's component whole, the same way every other
// zero-address part in the kit (the checkbox's own hidden input, the date picker's own week-
// number cells) is simply not modeled as a part of its own.

import { anatomy as toastAnatomy } from "@zag-js/toast/anatomy";

/** Parts and addresses — taken, not ours. Six, and the map below covers them all. */
export const anatomy = toastAnatomy;

/** Part addresses: `attrs` for the node, `selector` for styling. Computed once — they are static. */
export const anatomyParts = anatomy.build();
