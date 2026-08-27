// RUNTIME anatomy of the switch (`ark-ui.com/docs/components/switch`) — the toggle counterpart
// to the checkbox: same binary fact, a different look and a different native input underneath.
//
// THIS FILE HOLDS PARTS AND ADDRESSES ONLY — nothing else, the same split as every other
// component's `entity/anatomy.ts`. The fuller runtime contract — per-part STATES, the variant
// axis, SETTINGS — lives one level up, in `passport.ts`. Editor-facing metadata is a further step
// removed, in `playground/index.ts`.
//
// The anatomy is NOT declared here: it arrives ready-made, the same reason and the same subpath
// discipline as every Ark-provided component in the kit. It physically lives in
// `@zag-js/switch/anatomy` — no Solid, no state machine, only the part declarations; Ark's own
// `switchAnatomy` is the SAME object, not a second copy of it. `@ark-ui/solid/switch/anatomy` is
// not taken for the same reason it never is: that subpath carries a `solid` branch with a `.jsx`
// file, and a passport reader without Solid (`packages/assembly`) would fail on it.
//
// FOUR parts: `root · label · control · thumb`. `hiddenInput` carries NO part and no address —
// the real `<input type="checkbox">` it renders stays in the document for focus, form
// submission, and the native `change` event, but Zag never spreads `parts.*.attrs` onto it
// (`switch.connect.mjs`, `getHiddenInputProps`). Same treatment as the checkbox's own hidden
// input — a node the provider does not address is not addressable by us either.

import { anatomy as switchAnatomy } from "@zag-js/switch/anatomy";

/** Parts and addresses — taken, not ours. Four, and the map below covers them all. */
export const anatomy = switchAnatomy;

/** Part addresses: `attrs` for the node, `selector` for styling. Computed once — they are static. */
export const anatomyParts = anatomy.build();
