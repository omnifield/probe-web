// RUNTIME anatomy of the drawer (`ark-ui.com/docs/components/drawer`) — a modal that slides in
// from an edge and can be swipe-dismissed.
//
// THIS FILE HOLDS PARTS AND ADDRESSES ONLY — nothing else, the same split as every other
// component's `entity/anatomy.ts`. The fuller runtime contract — per-part STATES, the variant
// axis, SETTINGS — lives one level up, in `passport.ts`. Editor-facing metadata is a further step
// removed, in `playground/index.ts`.
//
// NOT A RENAME OF THE DIALOG — a genuinely separate `@zag-js/drawer` package, with its own
// anatomy, machine, and swipe-gesture connector (`drawer.connect.mjs`, 271 lines — the biggest
// connector this small a part count has needed in the kit, checked in full). `@ark-ui/solid`'s
// own `drawer.anatomy.ts` does nothing but `export { anatomy } from "@zag-js/drawer"` — no
// `.extendWith(...)`.
//
// TEN parts: `positioner · content · title · description · trigger · backdrop · grabber ·
// grabberIndicator · closeTrigger · swipeArea`. No `root` — same situation as the popover's/
// dialog's own (`../entity/passport.ts` explains the stand-in choice). `grabber`/
// `grabberIndicator` are the drag handle (a pull-bar affordance, mobile bottom-sheet style);
// `swipeArea` is an invisible, `aria-hidden` gesture-catcher near the closed edge that lets a
// closed drawer be swiped back OPEN.
//
// THREE MORE Solid components ship alongside this component — `DrawerStack`/`DrawerIndent`/
// `DrawerIndentBackground` — but NONE of them draw from this anatomy at all: checked in
// `@ark-ui/solid`'s own chunk, `getIndentProps()`/`getIndentBackgroundProps()` come from a
// SEPARATE API (`@zag-js/drawer`'s own `createStack`/`connectStack`, a different machine
// entirely, for coordinating SEVERAL nested drawers open at once). They carry no anatomy part —
// not the drawer's, not one of their own — so nothing here wraps them: a part the provider itself
// never addressed is not addressable by this passport, the same rule the checkbox's own hidden
// input and the date picker's own week-number cells already follow.

import { anatomy as drawerAnatomy } from "@zag-js/drawer/anatomy";

/** Parts and addresses — taken, not ours. Ten, and the map below covers them all. */
export const anatomy = drawerAnatomy;

/** Part addresses: `attrs` for the node, `selector` for styling. Computed once — they are static. */
export const anatomyParts = anatomy.build();
