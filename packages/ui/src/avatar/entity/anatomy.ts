// RUNTIME anatomy of the avatar (`ark-ui.com/docs/components/avatar`) — the smallest anatomy the
// kit has taken from Ark so far.
//
// THIS FILE HOLDS PARTS AND ADDRESSES ONLY — nothing else, the same split as every other
// component's `entity/anatomy.ts`. The fuller runtime contract — per-part STATES, the variant
// axis, SETTINGS — lives one level up, in `passport.ts`. Editor-facing metadata is a further step
// removed, in `playground/index.ts`.
//
// The anatomy is NOT declared here: it arrives ready-made, the same reason and the same subpath
// discipline as every Zag-backed component in the kit. It physically lives in
// `@zag-js/avatar/anatomy`; Ark's own `avatarAnatomy` is the SAME object, re-exported straight
// from `@zag-js/avatar` — checked in the installed chunk
// (`src/components/avatar/avatar.anatomy.ts` does nothing but
// `export { anatomy } from "@zag-js/avatar"`), no `.extendWith(...)`.
//
// THREE parts: `root · image · fallback`. No hidden input, no indicator, no positioner — a
// picture with a loading-state fallback, and nothing else.

import { anatomy as avatarAnatomy } from "@zag-js/avatar/anatomy";

/** Parts and addresses — taken, not ours. Three, and the map below covers them all. */
export const anatomy = avatarAnatomy;

/** Part addresses: `attrs` for the node, `selector` for styling. Computed once — they are static. */
export const anatomyParts = anatomy.build();
