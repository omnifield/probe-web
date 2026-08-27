// RUNTIME anatomy of the radio group (`ark-ui.com/docs/components/radio-group`).
//
// THIS FILE HOLDS PARTS AND ADDRESSES ONLY — nothing else, the same split as every other
// component's `entity/anatomy.ts`. The fuller runtime contract — per-part STATES, the variant
// axis, SETTINGS — lives one level up, in `passport.ts`. Editor-facing metadata is a further step
// removed, in `playground/index.ts`.
//
// The anatomy is NOT declared here: it arrives ready-made, the same reason and the same subpath
// discipline as every Zag-backed component in the kit. It physically lives in
// `@zag-js/radio-group/anatomy`; Ark's own `radioGroupAnatomy` is the SAME object, re-exported
// straight from `@zag-js/radio-group`, not a second copy (`@ark-ui/solid`'s own
// `radio-group.anatomy.ts` does nothing but `export { anatomy } from "@zag-js/radio-group"` —
// checked in the installed chunk, no `.extendWith(...)` the way carousel's did). `@ark-ui/solid/
// radio-group` is not taken for the anatomy (only for the components in `../components/index.tsx`)
// for the usual reason: that subpath carries a `.jsx` file, and a passport reader without Solid
// (`packages/assembly`) would fail on it.
//
// SIX parts: `root · label · item · itemText · itemControl · indicator`. A seventh node exists in
// the real DOM — the hidden `<input type="radio">` per item — but it carries no anatomy part at
// all: `getItemHiddenInputProps` (`radio-group.connect.mjs`) does not spread `parts.*.attrs`,
// same finding as the checkbox's own hidden input.

import { anatomy as radioGroupAnatomy } from "@zag-js/radio-group/anatomy";

/** Parts and addresses — taken, not ours. Six, and the map below covers them all. */
export const anatomy = radioGroupAnatomy;

/** Part addresses: `attrs` for the node, `selector` for styling. Computed once — they are static. */
export const anatomyParts = anatomy.build();
