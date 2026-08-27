// RUNTIME anatomy of the segment group (`ark-ui.com/docs/components/segment-group`).
//
// THIS FILE HOLDS PARTS AND ADDRESSES ONLY — nothing else, the same split as every other
// component's `entity/anatomy.ts`. The fuller runtime contract — per-part STATES, the variant
// axis, SETTINGS — lives one level up, in `passport.ts`. Editor-facing metadata is a further step
// removed, in `playground/index.ts`.
//
// NOT A NEW MACHINE — this IS the radio group's, renamed. `@ark-ui/solid`'s own
// `segment-group.anatomy.ts` does exactly `import { anatomy } from "@zag-js/radio-group"; var
// segmentGroupAnatomy = anatomy.rename("segment-group")` — checked in the installed chunk, and
// confirmed one level deeper: `use-segment-group.ts` imports `* as segmentGroup from
// "@zag-js/radio-group"` and calls THAT package's own `machine`/`connect` directly. There is no
// `@zag-js/segment-group` package at all (checked: absent from `node_modules`) — Ark ships this
// as radio-group's own machine wearing a different `data-scope`, the WAI-ARIA radio pattern with
// a segmented-control LOOK, not a different interaction model. `.rename(...)` (`@zag-js/anatomy`'s
// own `create-anatomy.mjs`) keeps the SAME six parts, only the `data-scope` value written by
// `.build()` changes (`"radio-group"` → `"segment-group"`).
//
// SIX parts, identical set to `../../radio-group/entity/anatomy.ts` (`PWEB-134`): `root · label ·
// item · itemText · itemControl · indicator`. A seventh node, `itemHiddenInput`, exists in the
// real DOM per item but carries no anatomy address — the exact same finding radio-group's own
// anatomy already logged, unchanged here because the connector computing it is the same one.

import { anatomy as radioGroupAnatomy } from "@zag-js/radio-group/anatomy";

/** Parts and addresses — the radio group's own, renamed. Six, and the map below covers them all. */
export const anatomy = radioGroupAnatomy.rename("segment-group");

/** Part addresses: `attrs` for the node, `selector` for styling. Computed once — they are static. */
export const anatomyParts = anatomy.build();
