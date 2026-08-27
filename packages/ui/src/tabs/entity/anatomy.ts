// RUNTIME anatomy of tabs (`ark-ui.com/docs/components/tabs`).
//
// THIS FILE HOLDS PARTS AND ADDRESSES ONLY — nothing else, the same split as every other
// component's `entity/anatomy.ts`. The fuller runtime contract — per-part STATES, the variant
// axis, SETTINGS — lives one level up, in `passport.ts`. Editor-facing metadata is a further step
// removed, in `playground/index.ts`.
//
// The anatomy is NOT declared here: it arrives ready-made, the same reason and the same subpath
// discipline as every Zag-backed component in the kit. It physically lives in
// `@zag-js/tabs/anatomy` — no Solid, no state machine, only the part declarations; Ark's own
// `tabsAnatomy` is the SAME object, not a second copy of it. `@ark-ui/solid/tabs` is not taken for
// the anatomy (only for the components in `../components/index.tsx`) for the usual reason: that
// subpath carries a `solid` branch with a `.jsx` file, and a passport reader without Solid
// (`packages/assembly`) would fail on it.
//
// FIVE parts: `root · list · trigger · content · indicator`. All five carry `data-orientation`
// (verified in `tabs.connect.mjs`) — the SAME device the accordion's `orientation` setting
// already stands on (`PWEB-104`: "the mark arrives as an attribute on EVERY part"), so
// orientation is a SETTING in `passport.ts`, not a per-part state repeated five times.

import { anatomy as tabsAnatomy } from "@zag-js/tabs/anatomy";

/** Parts and addresses — taken, not ours. Five, and the map below covers them all. */
export const anatomy = tabsAnatomy;

/** Part addresses: `attrs` for the node, `selector` for styling. Computed once — they are static. */
export const anatomyParts = anatomy.build();
