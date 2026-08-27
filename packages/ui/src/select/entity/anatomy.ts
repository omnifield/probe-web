// RUNTIME anatomy of the select (`ark-ui.com/docs/components/select`) — the kit's first
// component with a floating dropdown and a data-driven item collection.
//
// THIS FILE HOLDS PARTS AND ADDRESSES ONLY — nothing else, the same split as the accordion's
// `entity/anatomy.ts`. The fuller runtime contract — per-part STATES, the variant axis,
// SETTINGS, the `definePassport` call that ties them together — lives one level up, in
// `passport.ts`. Editor-facing metadata is a further step removed, in `playground/index.ts`.
//
// The anatomy is NOT declared here: it arrives ready-made with the component, the same reason
// and the same subpath discipline as the accordion and the checkbox. It physically lives in
// `@zag-js/select/anatomy` — no Solid, no state machine, only the part declarations; Ark's own
// `selectAnatomy` is the SAME object, not a second copy of it. `@ark-ui/solid/select/anatomy`
// is not taken for the same reason it never is: that subpath carries a `solid` branch with a
// `.jsx` file, and a passport reader without Solid (`packages/assembly`) would fail on it.
//
// FIFTEEN parts — the largest anatomy in the kit so far, and every one of them earns its place:
//
//   `root · label · control · trigger · valueText · clearTrigger · indicator · positioner ·
//    content · list · itemGroup · itemGroupLabel · item · itemText · itemIndicator`
//
// `list` is real but UNDOCUMENTED on Ark's own site (checked 2026-08-26: the component reference
// names every other part, `list` is not in the usage example nor in the prose — only present in
// the anatomy itself and in the Solid wrapper's exports). Taking the anatomy WHOLE, not curated,
// is the same discipline the accordion and the checkbox already stand on: the kit does not
// invent parts, and does not quietly drop ones it does not have a use for yet. `list` is treated
// honestly below (`entity/passport.ts`, `playground/index.ts`) — declared, wired into the kit,
// with no states of its own (none exist on it, `select.connect.mjs`) and a place in the nesting
// rule as an optional inner listbox, alongside items nested directly in `content` the way the
// documented example does it.
//
// `hiddenSelect` carries NO part and no address at all — the real `<select>` it renders stays in
// the document for form submission, autofill, and change events, but Zag never spreads
// `parts.*.attrs` onto it (`select.connect.mjs`, `getHiddenSelectProps`). Same treatment as the
// checkbox's hidden input: a node the provider did not address is not addressable by us either.

import { anatomy as selectAnatomy } from "@zag-js/select/anatomy";

/** Parts and addresses — taken, not ours. Fifteen, and the map below covers them all. */
export const anatomy = selectAnatomy;

/** Part addresses: `attrs` for the node, `selector` for styling. Computed once — they are static. */
export const anatomyParts = anatomy.build();
