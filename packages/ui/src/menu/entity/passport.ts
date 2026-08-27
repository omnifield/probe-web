// RUNTIME passport of the menu — anatomy (`anatomy.ts`) plus everything else the running app
// needs: per-part STATES and the variant axis, tied together by `definePassport`.
//
// THIS FILE IS RUNTIME ONLY, same as the anatomy it builds on — it ships in the app bundle.
// Editor-facing metadata lives in `playground/index.ts` instead; that file depends on this one,
// never the other way.
//
// Every mark below was read from `@zag-js/menu/menu.connect.mjs` (463 lines, read in full), the
// same rigor the rest of the kit's passports read from a `.connect.mjs`.
//
// ## There is NO `root` part — `positioner` stands in, the popover's/dialog's/drawer's own precedent
//
// `MenuRoot` renders no DOM node of its own (checked in `@ark-ui/solid`'s own `menu-root.tsx`:
// pure context/presence providers).
//
// ## Items are NEVER individually focusable — `content` holds real focus for all of them
//
// `getContentProps` sets `tabIndex: 0` and `aria-activedescendant: computed("highlightedId")` on
// `content` ITSELF; no `item`/`itemIndicator`/`itemText`/`triggerItem` ever gets a `tabIndex` of
// their own anywhere in this connector. Keyboard/pointer "current item" is a VIRTUAL fact —
// `data-highlighted` — not real DOM focus. This is why NEITHER `:focus-visible` NOR `:hover` are
// declared on any item-family part below: `onPointerMove`/`onPointerLeave` on `item` are wired to
// compute `data-highlighted` itself (the same JS-tracking-over-native-pseudo reasoning the
// checkbox's own root/control/indicator already established), so a native `:hover` would be
// EITHER redundant with `data-highlighted` or actively wrong (highlighted can be set by keyboard
// alone, with no pointer over the item at all). No `:active`/`data-active` either — this
// connector never tracks a pressed state for any part, checked as an absence, not an oversight.
//
// ## `item` serves THREE shapes through one address: plain, checkbox, and radio
//
// `getItemProps` (a plain `MenuItem`) sets `disabled`/`highlighted` only. `getOptionItemProps`
// (`MenuCheckboxItem`/`MenuRadioItem`) SPREADS `getItemProps` first, then adds `data-type`
// (`"checkbox"` | `"radio"`) and `data-state` (`"checked"`/`"unchecked"`) on top — real marks,
// but present ONLY for option items, the same "sometimes absent, not always `false`" shape the
// date picker's own `tableCellTrigger` states already have for view-specific marks.
// `itemIndicator`/`itemText` mirror the SAME `checked`/`unchecked`/`disabled`/`highlighted`
// (`getOptionItemState` recomputes the identical facts for them), but carry NO `data-type` of
// their own — checked, that mark only ever appears on `item`.
//
// ## `triggerItem` — a SUBMENU's own trigger, wearing its PARENT's item facts too
//
// `getTriggerItemProps(childApi)` merges the PARENT menu's own `getItemProps` (this node is one
// of the parent's items — `disabled`/`highlighted` come from there) with the CHILD submenu's own
// `getTriggerProps()` (`isSubmenu` true there, so it draws with `parts.triggerItem.attrs`, and
// contributes `data-state` for whether the CHILD submenu itself is open). The child's own trigger
// call passes no `value`, so `data-current` never appears on `triggerItem` — only on a top-level
// `trigger`. Rendered as `ark.div` (`@ark-ui/solid`'s own `PolymorphicProps<'div'>`), not a real
// `<button>` — but per "items are never individually focusable" above, that distinction does not
// cost it any pseudo-class either way; none would have been declared on a button-shaped version.
//
// ## `positioner`'s geometry variables — the SAME popper mechanism as the popover's/select's
//
// `getPositionerProps` calls the SAME `@zag-js/popper` `getPlacementStyles` the popover's own
// positioner stands on — the same four custom properties, checked in `@zag-js/popper/
// get-placement.mjs` directly, not assumed from that precedent.

import { defineSettings, definePassport, type PassportState } from "@omnifield/probe-web-skin/model";
// TYPE ONLY: `import type` is erased at build time entirely, and the `./passport` subpath stays
// what it is sold as — data with no Solid. Needed only so the setting keys are checked against
// the component's real props.
import type { MenuProps } from "../components/index.jsx";
import { anatomy } from "./anatomy.js";

/** Open — unconditional: the sibling value is always `closed`. */
const open: PassportState = { name: "open", mark: { kind: "attribute", name: "data-state", value: "open" } };
/** Closed — the same attribute, the other value. */
const closed: PassportState = { name: "closed", mark: { kind: "attribute", name: "data-state", value: "closed" } };
const openClosed: readonly PassportState[] = [open, closed];

/** Present only in a multi-trigger menu (`value` prop) — real either way, always written as a boolean. */
const current: PassportState = { name: "current", mark: { kind: "attribute", name: "data-current" } };

/** A genuine button with no JS-tracked pointer state — the plain button's own reasoning. Top-level `trigger` only. */
const buttonPseudos: readonly PassportState[] = [
  { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
  { name: "focus-visible", mark: { kind: "pseudo", name: ":focus-visible" } },
  { name: "active", mark: { kind: "pseudo", name: ":active" } },
];

/** This item cannot be selected — its own flag, or (for `triggerItem`) the parent item's. */
const disabled: PassportState = { name: "disabled", mark: { kind: "attribute", name: "data-disabled" } };
/** The current keyboard/pointer target — a VIRTUAL fact, `content` holds real focus (see the file header). */
const highlighted: PassportState = { name: "highlighted", mark: { kind: "attribute", name: "data-highlighted" } };

/** This checkbox/radio item is checked — real only on an OPTION item, see the file header. */
const checked: PassportState = { name: "checked", mark: { kind: "attribute", name: "data-state", value: "checked" } };
const unchecked: PassportState = { name: "unchecked", mark: { kind: "attribute", name: "data-state", value: "unchecked" } };

/** Shared by `item`/`itemIndicator`/`itemText` — the option-item pair, absent on a plain item. */
const optionStates: readonly PassportState[] = [checked, unchecked];

/** Passport of the menu — anatomy plus what anatomy alone does not say. */
export const passport = definePassport({
  anatomy,
  // See "There is NO `root` part" above: `positioner` stands in, deliberately, not by omission.
  root: "positioner",
  parts: [
    { name: "arrow", states: [] },
    { name: "arrowTip", states: [] },
    {
      name: "positioner",
      states: [],
      variables: [
        { name: "--reference-width", setBy: "kit" },
        { name: "--reference-height", setBy: "kit" },
        { name: "--available-width", setBy: "kit" },
        { name: "--available-height", setBy: "kit" },
      ],
    },
    { name: "content", states: openClosed },
    { name: "indicator", states: openClosed },
    { name: "trigger", states: [...openClosed, current, ...buttonPseudos] },
    // No pseudo, no `current` — see the file header ("a SUBMENU's own trigger").
    { name: "triggerItem", states: [...openClosed, disabled, highlighted] },
    { name: "contextTrigger", states: [...openClosed, current] },
    { name: "separator", states: [] },
    { name: "itemGroup", states: [] },
    { name: "itemGroupLabel", states: [] },
    {
      name: "item",
      // `data-type` (`"radio"`/`"checkbox"`) appears ONLY on `item` — see the file header.
      states: [
        disabled,
        highlighted,
        ...optionStates,
        { name: "radio", mark: { kind: "attribute", name: "data-type", value: "radio" } },
        { name: "checkbox", mark: { kind: "attribute", name: "data-type", value: "checkbox" } },
      ],
    },
    { name: "itemIndicator", states: [disabled, highlighted, ...optionStates] },
    { name: "itemText", states: [disabled, highlighted, ...optionStates] },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  // NO settings from the closed vocabulary apply: `composite`/`typeahead`/`loopFocus`/
  // `closeOnSelect` are all real props, but none is `orientation`/`multiple`/`collapsible` —
  // the same empty result the dialog's/drawer's own settings already show.
  settings: defineSettings<MenuProps>({}),
});
