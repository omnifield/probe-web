// RUNTIME anatomy of the table — the kit's first OWN compound component, the same category as
// the button (`PWEB-2`): Ark UI ships no table at all, headless or otherwise, so there is no
// upstream anatomy to take. Declared with the same function every ready-made Ark anatomy uses —
// `createAnatomy` — the button's own `entity/anatomy.ts` is the direct precedent for "no library,
// declare it yourself."
//
// THIS FILE HOLDS PARTS AND ADDRESSES ONLY — nothing else, the same split as every other
// component's `entity/anatomy.ts`. The fuller runtime contract — per-part STATES, the variant
// axis, SETTINGS — lives one level up, in `passport.ts`. Editor-facing metadata is a further step
// removed, in `playground/index.ts`.
//
// NINE parts, one more than the row/column skeleton alone needs:
//
//   root · caption · head · headRow · headerCell · headerSortTrigger · body · row · cell
//
// `headerCell` (the `<th>`) and `headerSortTrigger` (a real `<button>` INSIDE it) are DELIBERATELY
// two parts, not one — the same split accordion draws between `item` (state owner) and `trigger`
// (the thing a pointer clicks). `aria-sort` belongs on the `<th>` itself per the WAI-ARIA
// `columnheader` role, not on a button inside it; the CLICKING and its hover/active/focus-visible
// look belong on a real `<button>`, which a `<th>` is not and should not pretend to be. Keeping
// them separate lets a skin address "the header cell's sort look" and "the sort button's press
// look" independently, and lets a column that cannot sort simply omit the trigger part — the cell
// itself never becomes fake-interactive.
//
// `row`/`cell` carry no per-row identity of their own (no selection, no pinning, no keyboard
// roving-tabindex navigation between cells) — v1's agreed scope is sorting ONLY (2026-08-26,
// user: "погнали" on exactly this cut). Row selection, column resize/pinning/grouping, and
// pagination are product concerns that `products/tables`' own (much larger, business-logic-laden)
// `DataTable` already owns — this primitive is deliberately smaller, the same "не строить вперёд
// спроса" restraint `grid`'s own anatomy names for its own `cell` part.

import { createAnatomy } from "@omnifield/probe-web-skin/model";

/** Parts of the table — nine, covering structure (root through cell) and one interaction (sort). */
export const anatomy = createAnatomy("table").parts(
  "root",
  "caption",
  "head",
  "headRow",
  "headerCell",
  "headerSortTrigger",
  "body",
  "row",
  "cell",
);

/** Part addresses: `attrs` for the node, `selector` for styling. Computed once — they are static. */
export const anatomyParts = anatomy.build();
