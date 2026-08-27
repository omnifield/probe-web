// RUNTIME anatomy of the dialog (`ark-ui.com/docs/components/dialog`) — the kit's modal, Ark's
// own name for it.
//
// THIS FILE HOLDS PARTS AND ADDRESSES ONLY — nothing else, the same split as every other
// component's `entity/anatomy.ts`. The fuller runtime contract — per-part STATES, the variant
// axis, SETTINGS — lives one level up, in `passport.ts`. Editor-facing metadata is a further step
// removed, in `playground/index.ts`.
//
// The anatomy is NOT declared here: it arrives ready-made, the same reason and the same subpath
// discipline as every Zag-backed component in the kit. It physically lives in
// `@zag-js/dialog/anatomy`; Ark's own `dialogAnatomy` is the SAME object, re-exported straight
// from `@zag-js/dialog` — checked in the installed chunk
// (`src/components/dialog/dialog.anatomy.ts` does nothing but
// `export { anatomy } from "@zag-js/dialog"`), no `.extendWith(...)` the way carousel's/date
// picker's did. `@ark-ui/solid/dialog` is not taken for the anatomy (only for the components in
// `../components/index.tsx`) for the usual reason: that subpath carries a `.jsx` file, and a
// passport reader without Solid (`packages/assembly`) would fail on it.
//
// SEVEN parts: `trigger · backdrop · positioner · content · title · description · closeTrigger`.
// No `root` — `DialogRoot` renders NO DOM node of its own (checked in `@ark-ui/solid`'s own
// `dialog-root.tsx`: `<DialogProvider><RenderStrategyProvider><PresenceProvider>{children}
// </PresenceProvider></RenderStrategyProvider></DialogProvider>`, pure context), the SAME
// situation the popover's own anatomy already found itself in — `../entity/passport.ts` picks
// `positioner` as the passport's nominal root, the popover's own precedent, not a fresh decision.

import { anatomy as dialogAnatomy } from "@zag-js/dialog/anatomy";

/** Parts and addresses — taken, not ours. Seven, and the map below covers them all. */
export const anatomy = dialogAnatomy;

/** Part addresses: `attrs` for the node, `selector` for styling. Computed once — they are static. */
export const anatomyParts = anatomy.build();
