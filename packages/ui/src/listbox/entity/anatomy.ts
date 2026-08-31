// RUNTIME anatomy of the listbox (`ark-ui.com/docs/components/listbox`) — a selectable list of
// options, single or multiple, with no floating layer of its own (unlike the select, everything
// is always visible; there is no trigger to open or close).
//
// THIS FILE HOLDS PARTS AND ADDRESSES ONLY — nothing else, the same split as every other
// component's `entity/anatomy.ts`. The fuller runtime contract — per-part STATES, the variant
// axis, SETTINGS — lives one level up, in `passport.ts`. Editor-facing metadata is a further step
// removed, in `playground/index.ts`.
//
// ## A third genuine exception to "always take anatomy from `@zag-js/<x>/anatomy`"
//
// `@zag-js/listbox/anatomy` declares TEN parts (`label · input · item · itemText ·
// itemIndicator · itemGroup · itemGroupLabel · content · root · valueText`). Taking anatomy from
// there would be INCOMPLETE, the same finding the carousel's own `entity/anatomy.ts` already
// names for itself: Ark's own Solid layer extends it — `@ark-ui/solid`'s
// `src/listbox.anatomy.ts` does `zagListboxAnatomy.extendWith("empty")`, and `ListboxEmpty`
// (`listbox-empty.tsx`) genuinely spreads `parts.empty.attrs` onto its node — a REAL, addressed
// part plain `@zag-js/listbox` does not know about at all.
//
// The fix is the same one the carousel's and the field's own anatomy already stand on: pull from
// `@ark-ui/solid/anatomy`, the package-level barrel, not the per-component
// `@ark-ui/solid/listbox/anatomy` subpath the accordion's header warns against (that one carries
// a `solid` branch with a `.jsx` file, and a passport reader without Solid, `packages/assembly`,
// fails on it). Verified the same way: `node -e "import('@ark-ui/solid/anatomy')…"` with no Solid
// condition active resolves the EXTENDED, eleven-part anatomy cleanly — one plain call to
// `.extendWith("empty")` on top of the same `@zag-js/listbox` object, no JSX anywhere in the chunk
// that builds it.
//
// ELEVEN parts: `root · label · input · content · item · itemText · itemIndicator · itemGroup ·
// itemGroupLabel · valueText · empty`. The last one is Ark-only and behaves differently from the
// ten Zag-backed ones — it mounts ONLY while the collection is empty (`listbox-empty.tsx` wraps
// it in `<Show when={size() === 0}>` itself), carries no data-attribute state of its own, and its
// very presence in the document IS the thing it addresses. See `passport.ts`.

import { listboxAnatomy } from "@ark-ui/solid/anatomy";

/** Parts and addresses — taken, not ours. Eleven, and the map below covers them all. */
export const anatomy = listboxAnatomy;

/** Part addresses: `attrs` for the node, `selector` for styling. Computed once — they are static. */
export const anatomyParts = anatomy.build();
