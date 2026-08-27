// RUNTIME anatomy of the scroll area (`ark-ui.com/docs/components/scroll-area`).
//
// THIS FILE HOLDS PARTS AND ADDRESSES ONLY — nothing else, the same split as every other
// component's `entity/anatomy.ts`. The fuller runtime contract — per-part STATES, the variant
// axis, SETTINGS — lives one level up, in `passport.ts`. Editor-facing metadata is a further step
// removed, in `playground/index.ts`.
//
// The anatomy is NOT declared here: it arrives ready-made, the same reason and the same subpath
// discipline as every Zag-backed component in the kit. It physically lives in
// `@zag-js/scroll-area/anatomy`; Ark's own `scrollAreaAnatomy` is the SAME object, re-exported
// straight from `@zag-js/scroll-area` — checked in the installed chunk
// (`src/components/scroll-area/scroll-area.anatomy.ts` does nothing but
// `export { anatomy } from "@zag-js/scroll-area"`), no `.extendWith(...)` the way carousel's/date
// picker's did. `@ark-ui/solid/scroll-area` is not taken for the anatomy (only for the components
// in `../components/index.tsx`) for the usual reason: that subpath carries a `.jsx` file, and a
// passport reader without Solid (`packages/assembly`) would fail on it.
//
// SIX parts: `root · viewport · content · scrollbar · thumb · corner`. `scrollbar`/`thumb` are
// each ONE anatomy part instantiated TWICE in a two-axis composition (once per
// `orientation="vertical"|"horizontal"`) — the same "one part, several real nodes" shape the
// tabs' own `trigger` already has (one per tab), not a gap.

import { anatomy as scrollAreaAnatomy } from "@zag-js/scroll-area/anatomy";

/** Parts and addresses — taken, not ours. Six, and the map below covers them all. */
export const anatomy = scrollAreaAnatomy;

/** Part addresses: `attrs` for the node, `selector` for styling. Computed once — they are static. */
export const anatomyParts = anatomy.build();
