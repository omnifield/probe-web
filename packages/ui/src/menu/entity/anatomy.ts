// RUNTIME anatomy of the menu (`ark-ui.com/docs/components/menu`) — a floating list of actions,
// with plain, checkbox, and radio items.
//
// THIS FILE HOLDS PARTS AND ADDRESSES ONLY — nothing else, the same split as every other
// component's `entity/anatomy.ts`. The fuller runtime contract — per-part STATES, the variant
// axis, SETTINGS — lives one level up, in `passport.ts`. Editor-facing metadata is a further step
// removed, in `playground/index.ts`.
//
// The anatomy is NOT declared here: it arrives ready-made, the same reason and the same subpath
// discipline as every Zag-backed component in the kit. It physically lives in
// `@zag-js/menu/anatomy`; Ark's own `menuAnatomy` is the SAME object, re-exported straight from
// `@zag-js/menu` — checked in the installed chunk (`src/components/menu/menu.anatomy.ts` does
// nothing but `export { anatomy } from "@zag-js/menu"`), no `.extendWith(...)`.
//
// FOURTEEN parts: `arrow · arrowTip · positioner · content · contextTrigger · indicator · item ·
// itemGroup · itemGroupLabel · itemIndicator · itemText · separator · trigger · triggerItem`.
//
// `MenuCheckboxItem`/`MenuRadioItem`/`MenuRadioItemGroup` — three MORE Solid components Ark
// ships — draw from EXISTING addresses, not new ones: checked in the installed chunk, both
// `MenuCheckboxItem` and `MenuRadioItem` call the SAME `getOptionItemProps({ type: "checkbox" |
// "radio", ... })` that produces `item`'s own props (just with a fixed `type`), and
// `MenuRadioItemGroup` calls the SAME `getItemGroupProps` that produces `itemGroup`'s own — they
// are convenience wrappers over `item`/`itemGroup`, not parts of their own, the same "part, not
// component" distinction the date picker's own week-number cells already draw.
//
// `triggerItem` exists as a SEPARATE anatomy address for the exact same reason a submenu needs
// one: `getTriggerProps` (`../entity/passport.ts`) spreads `parts.trigger.attrs` for a top-level
// menu's own trigger, but `parts.triggerItem.attrs` for the SAME function called on a submenu
// (`isSubmenu` — a submenu's trigger IS simultaneously a menu item of its parent menu, and needs
// an address that says so).

import { anatomy as menuAnatomy } from "@zag-js/menu/anatomy";

/** Parts and addresses — taken, not ours. Fourteen, and the map below covers them all. */
export const anatomy = menuAnatomy;

/** Part addresses: `attrs` for the node, `selector` for styling. Computed once — they are static. */
export const anatomyParts = anatomy.build();
