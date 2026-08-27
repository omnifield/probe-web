// RUNTIME anatomy of the slider (`ark-ui.com/docs/components/slider`).
//
// THIS FILE HOLDS PARTS AND ADDRESSES ONLY — nothing else, the same split as every other
// component's `entity/anatomy.ts`. The fuller runtime contract — per-part STATES, the variant
// axis, SETTINGS — lives one level up, in `passport.ts`. Editor-facing metadata is a further step
// removed, in `playground/index.ts`.
//
// The anatomy is NOT declared here: it arrives ready-made, the same reason and the same subpath
// discipline as every Zag-backed component in the kit. It physically lives in
// `@zag-js/slider/anatomy`; Ark's own `sliderAnatomy` is the SAME object, re-exported straight
// from `@zag-js/slider` — checked in the installed chunk
// (`src/components/slider/slider.anatomy.ts` does nothing but
// `export { anatomy } from "@zag-js/slider"`), no `.extendWith(...)`.
//
// TEN parts: `root · label · thumb · valueText · track · range · control · markerGroup · marker
// · draggingIndicator`. `thumb`/`marker` are each ONE anatomy part instantiated MULTIPLE times —
// one `thumb` per value in a range slider, one `marker` per tick mark — the same "one part,
// several real nodes" shape the tabs' own `trigger` already has. An eleventh node, the real
// `<input type="text" hidden>` (`hiddenInput`, one per thumb, form participation only), carries
// no anatomy address — the same finding the checkbox's own hidden input already logged.

import { anatomy as sliderAnatomy } from "@zag-js/slider/anatomy";

/** Parts and addresses — taken, not ours. Ten, and the map below covers them all. */
export const anatomy = sliderAnatomy;

/** Part addresses: `attrs` for the node, `selector` for styling. Computed once — they are static. */
export const anatomyParts = anatomy.build();
