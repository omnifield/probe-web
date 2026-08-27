// RUNTIME anatomy of the toggle group (`ark-ui.com/docs/components/toggle-group`).
//
// THIS FILE HOLDS PARTS AND ADDRESSES ONLY — nothing else, the same split as every other
// component's `entity/anatomy.ts`. The fuller runtime contract — per-part STATES, the variant
// axis, SETTINGS — lives one level up, in `passport.ts`. Editor-facing metadata is a further step
// removed, in `playground/index.ts`.
//
// The anatomy is NOT declared here: it arrives ready-made, the same reason and the same subpath
// discipline as every Zag-backed component in the kit. It physically lives in
// `@zag-js/toggle-group/anatomy`; Ark's own `toggleGroupAnatomy` is the SAME object, re-exported
// straight from `@zag-js/toggle-group` — checked in the installed chunk
// (`src/components/toggle-group/toggle-group.anatomy.ts` does nothing but
// `export { anatomy } from "@zag-js/toggle-group"`), no `.extendWith(...)` the way carousel's did.
// `@ark-ui/solid/toggle-group` is not taken for the anatomy (only for the components in
// `../components/index.tsx`) for the usual reason: that subpath carries a `.jsx` file, and a
// passport reader without Solid (`packages/assembly`) would fail on it.
//
// TWO parts only: `root · item` — the smallest anatomy in the kit so far. No hidden input, no
// separate label or indicator: each `item` is a genuine `<button type="button">` (`getItemProps`,
// `toggle-group.connect.mjs`), the same "no wrapping machinery needed" shape as the plain button.

import { anatomy as toggleGroupAnatomy } from "@zag-js/toggle-group/anatomy";

/** Parts and addresses — taken, not ours. Two, and the map below covers them both. */
export const anatomy = toggleGroupAnatomy;

/** Part addresses: `attrs` for the node, `selector` for styling. Computed once — they are static. */
export const anatomyParts = anatomy.build();
