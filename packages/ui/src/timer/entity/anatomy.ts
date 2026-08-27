// RUNTIME anatomy of the timer (`ark-ui.com/docs/components/timer`) — a start/pause/reset
// stopwatch or countdown.
//
// THIS FILE HOLDS PARTS AND ADDRESSES ONLY — nothing else, the same split as every other
// component's `entity/anatomy.ts`. The fuller runtime contract — per-part STATES, the variant
// axis, SETTINGS — lives one level up, in `passport.ts`. Editor-facing metadata is a further step
// removed, in `playground/index.ts`.
//
// The anatomy is NOT declared here: it arrives ready-made, the same reason and the same subpath
// discipline as every Zag-backed component in the kit. It physically lives in
// `@zag-js/timer/anatomy`; Ark's own `timerAnatomy` is the SAME object, re-exported straight from
// `@zag-js/timer` — checked in the installed chunk (`src/components/timer/timer.anatomy.ts` does
// nothing but `export { anatomy } from "@zag-js/timer"`), no `.extendWith(...)`.
//
// EIGHT parts: `root · area · control · item · itemValue · itemLabel · actionTrigger ·
// separator`. `item` is ONE anatomy part instantiated once per time unit shown (seconds, minutes,
// …) — the same "one part, several nodes" shape the tabs' own trigger already has.
//
// `itemLabel`/`itemValue` HAVE NO SOLID WRAPPER IN THIS VERSION OF `@ark-ui/solid` (5.38.2) —
// checked directly: `@zag-js/timer/timer.connect.mjs` implements `getItemLabelProps`/
// `getItemValueProps` (real, working methods), but `@ark-ui/solid`'s own `timer.ts` barrel only
// exports `Root`/`Area`/`Control`/`Item`/`ActionTrigger`/`Separator` — six of the eight parts, a
// genuine gap in the Solid package for this component (its own `TimerItem` renders the formatted
// value as plain text directly, with no decomposed value/label sub-parts to reach for).
// `../components/index.tsx` closes it by hand-authoring `TimerItemLabel`/`TimerItemValue` off the
// SAME public `useTimerContext()` hook Ark's own components use internally — not a workaround, a
// completion of the same mechanism using its own public surface.

import { anatomy as timerAnatomy } from "@zag-js/timer/anatomy";

/** Parts and addresses — taken, not ours. Eight, and the map below covers them all. */
export const anatomy = timerAnatomy;

/** Part addresses: `attrs` for the node, `selector` for styling. Computed once — they are static. */
export const anatomyParts = anatomy.build();
