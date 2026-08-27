// RUNTIME anatomy of the toggle (`ark-ui.com/docs/components/toggle`) — tied with avatar for the
// smallest anatomy the kit has taken from Ark so far.
//
// THIS FILE HOLDS PARTS AND ADDRESSES ONLY — nothing else, the same split as every other
// component's `entity/anatomy.ts`. The fuller runtime contract — per-part STATES, the variant
// axis, SETTINGS — lives one level up, in `passport.ts`. Editor-facing metadata is a further step
// removed, in `playground/index.ts`.
//
// The anatomy is NOT declared here: it arrives ready-made, the same reason and the same subpath
// discipline as every Zag-backed component in the kit. It physically lives in
// `@zag-js/toggle/anatomy`; Ark's own `toggleAnatomy` is the SAME object, re-exported through its
// own chunk, no `.extendWith(...)`.
//
// TWO parts: `root · indicator`. A single `<button aria-pressed>` plus an optional glyph inside
// it — no hidden input, no label, nothing else. NOT the same thing as `packages/ui/src/toggle.tsx`
// (the older, Kobalte-backed flat-file primitive already exported from `../../index.ts`): same
// English word, unrelated modules, unrelated anatomies — that file predates this wave and this
// folder does not replace it (`PWEB-7`, the flat-file → folder migration is its own pass, not a
// side effect of adding an Ark component).

import { anatomy as toggleAnatomy } from "@zag-js/toggle/anatomy";

/** Parts and addresses — taken, not ours. Two, and the map below covers them both. */
export const anatomy = toggleAnatomy;

/** Part addresses: `attrs` for the node, `selector` for styling. Computed once — they are static. */
export const anatomyParts = anatomy.build();
