// RUNTIME anatomy of the date picker (`ark-ui.com/docs/components/date-picker`) — the largest
// anatomy in the kit so far.
//
// THIS FILE HOLDS PARTS AND ADDRESSES ONLY — nothing else, the same split as every other
// component's `entity/anatomy.ts`. The fuller runtime contract — per-part STATES, the variant
// axis, SETTINGS — lives one level up, in `passport.ts`. Editor-facing metadata is a further step
// removed, in `playground/index.ts`.
//
// The anatomy is NOT declared here: it arrives ready-made, the same reason and the same subpath
// discipline as every Zag-backed component in the kit. `@zag-js/date-picker/anatomy` declares 24
// parts; Ark EXTENDS it by one (`.extendWith("view", "valueText")` — checked in the installed
// chunk, `src/components/date-picker/date-picker.anatomy.ts`): `"view"` is already one of the 24
// (a no-op re-add), `"valueText"` is genuinely new — it has no `getValueTextProps` in
// `date-picker.connect.mjs` at all, its address comes ONLY from this barrel
// (`@ark-ui/solid/dist/chunk/RFHGTBGX.jsx`'s own `DatePickerValueText`, which spreads
// `datePickerAnatomy.build().valueText.attrs` directly, not through the zag connector). The same
// finding shape carousel's own anatomy already logged for `autoplayIndicator` — checked before
// writing this file, not assumed from that precedent. `@ark-ui/solid/anatomy` (the package
// barrel) carries the EXTENDED version and is where the 25th part is taken from; the bare 24 are
// still read off `@zag-js/date-picker/anatomy` directly (no Solid, no `.jsx` file, safe for a
// passport reader without Solid — `packages/assembly`) — the two sources agree on the 24 they
// share, checked live (`Object.keys` on each `.build()`), not assumed.
//
// TWENTY-FIVE parts. Two are addressed but have NO `getXxxProps` of their own in the connector at
// all: `week-number` cells reuse `tableCell`'s own address (`getWeekNumberCellProps`/
// `getWeekNumberHeaderCellProps` both spread `parts.tableCell.attrs`, not a part of their own) —
// there is no `weekNumberCell` entry in the 25, and none is missing: the two Solid components
// Ark ships for week numbers (`DatePickerWeekNumberCell`/`DatePickerWeekNumberHeaderCell`) are
// real, addressable, DIFFERENT-LOOKING nodes, they just share `tableCell`'s coordinate — the same
// "part, not component" distinction the kit's own passport model draws everywhere else.

import { datePickerAnatomy } from "@ark-ui/solid/anatomy";

/**
 * Parts and addresses — taken, not ours. `datePickerAnatomy` carries Ark's `valueText` addition
 * on top of the 24 zag already declares; using it (rather than the bare zag anatomy) means the
 * passport and the real Solid components (`../components/index.tsx`, which import
 * `DatePickerValueText` from `@ark-ui/solid/date-picker`) stay addressed by the SAME object.
 */
export const anatomy = datePickerAnatomy;

/** Part addresses: `attrs` for the node, `selector` for styling. Computed once — they are static. */
export const anatomyParts = anatomy.build();
