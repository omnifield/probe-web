// RUNTIME anatomy of the popover (`ark-ui.com/docs/components/popover`).
//
// THIS FILE HOLDS PARTS AND ADDRESSES ONLY — nothing else, the same split as every other
// component's `entity/anatomy.ts`. The fuller runtime contract — per-part STATES, the variant
// axis, SETTINGS — lives one level up, in `passport.ts`. Editor-facing metadata is a further step
// removed, in `playground/index.ts`.
//
// The anatomy is NOT declared here: it arrives ready-made, the same reason and the same subpath
// discipline as every Zag-backed component in the kit. It physically lives in
// `@zag-js/popover/anatomy` — no Solid, no state machine, only the part declarations; Ark's own
// `popoverAnatomy` is the SAME object, not a second copy of it — CHECKED, unlike the carousel's
// own anatomy (`../../carousel/entity/anatomy.ts`, `PWEB-132`): `@ark-ui/solid`'s own
// `carousel.anatomy.ts` extends the Zag object with two Ark-only parts, but its
// `popover.anatomy.ts` chunk is a bare `export { anatomy } from '@zag-js/popover'` — nothing
// added, so the plain Zag subpath is the right one here, same as the accordion's.
//
// TEN parts: `arrow · arrowTip · anchor · trigger · indicator · positioner · content · title ·
// description · closeTrigger`. `arrow`/`arrowTip` are two DIFFERENT nodes for one visual
// triangle — `arrow` is the outer clipping box the popper positions, `arrowTip` is the inner
// diamond that gets rotated into a point (checked in `popover.connect.mjs`: `arrow` nests
// `arrowTip`, matching Ark's own documented composition).
//
// NO `root` part — the first component in the kit missing one. `passport.ts` explains why
// (`PopoverRoot` renders no DOM node of its own — pure context) and what stands in for it.

import { anatomy as popoverAnatomy } from "@zag-js/popover/anatomy";

/** Parts and addresses — taken, not ours. Ten, and the map below covers them all. */
export const anatomy = popoverAnatomy;

/** Part addresses: `attrs` for the node, `selector` for styling. Computed once — they are static. */
export const anatomyParts = anatomy.build();
