// RUNTIME passport of the radio group — anatomy (`anatomy.ts`) plus everything else the running
// app needs: per-part STATES, the variant axis, and SETTINGS, tied together by `definePassport`.
//
// THIS FILE IS RUNTIME ONLY, same as the anatomy it builds on — it ships in the app bundle.
// Editor-facing metadata lives in `playground/index.ts` instead; that file depends on this one,
// never the other way.
//
// Every mark below was read from `@zag-js/radio-group/radio-group.connect.mjs`, the same rigor
// the rest of the kit's passports ask for.
//
// ## States are NOT one shared dictionary here — unlike the checkbox's or the switch's
//
// `root`/`label` carry the GROUP's own facts (`disabled`/`invalid`/`required`, from
// `getRootProps`/`getLabelProps` — the whole set is disabled, or the form rejected it, or it will
// be required on submit). `item`/`itemText`/`itemControl` carry the PER-ITEM facts instead
// (`getItemDataAttrs`, shared by exactly those three `getXxxProps` functions): `checked` (this one
// value is the chosen one), `disabled`/`invalid` (this item's own, OR the group's), `readonly`,
// `hover`, `focus`, `focus-visible`. `active` is narrower still — `getItemControlProps` alone adds
// `data-active`, `item`/`itemText` do not. `indicator` carries only the group's `disabled` (plus
// its position, below) — it has no `data-state` of its own; it is one shared node, not per-item.
//
// ## Focus is mirrored, same finding as the checkbox's
//
// Real DOM focus lives on each item's hidden `<input>`, not on any visible part — `onFocus`/
// `onBlur` sit there, not on `item`/`itemText`/`itemControl` — and Zag mirrors the result onto
// those three as `data-focus`/`data-focus-visible` data, never a pseudo-class.
//
// ## The indicator's `--left`/`--top`/`--width`/`--height` are the measured, sliding position
//
// The same device as the tabs' own indicator (`PWEB-89`): the kit measures the chosen item's box
// and places these four custom properties on the indicator node (`getIndicatorProps`) — without
// them the "slides to the chosen item" look has nothing to address.
//
// ## `data-orientation`/`data-ssr`/`data-ownedby` — settings and identity, not states
//
// `data-orientation` reaches all six parts (verified below) — the same "one setting, checked
// present everywhere" shape the tabs' own `orientation` already stands on, so it is declared once
// as a SETTING in this file, not six times as a repeated state. `data-ssr` (on `item`/`itemText`/
// `itemControl`) is a bootstrapping/timing artifact, the same category as the tabs' own exclusion.
// `data-ownedby` (on the hidden input) names WHICH group owns it — wiring, not a look.

import { defineSettings, definePassport, type PassportState } from "@omnifield/probe-web-skin/model";
// TYPE ONLY: `import type` is erased at build time entirely, and the `./passport` subpath stays
// what it is sold as — data with no Solid. Needed only so the setting keys are checked against
// the component's real props.
import type { RadioGroupProps } from "../components/index.jsx";
import { anatomy } from "./anatomy.js";

/** The group is disabled — no item can be chosen. Reaches `root`/`label`/`item`s/`indicator`. */
const disabled: PassportState = {
  name: "disabled",
  mark: { kind: "attribute", name: "data-disabled" },
};

/** The enclosing form rejected the value; the set cannot say why, only that. */
const invalid: PassportState = {
  name: "invalid",
  mark: { kind: "attribute", name: "data-invalid" },
};

/** The form will demand a choice on submit. Group-level only — `root`/`label`. */
const required: PassportState = {
  name: "required",
  mark: { kind: "attribute", name: "data-required" },
};

/** This item is the one currently chosen — the same attribute names `unchecked` below with the other value. */
const checked: PassportState = {
  name: "checked",
  mark: { kind: "attribute", name: "data-state", value: "checked" },
};

/** Not the chosen item — always one or the other. */
const unchecked: PassportState = {
  name: "unchecked",
  mark: { kind: "attribute", name: "data-state", value: "unchecked" },
};

/** This item's value is visible, choosing a different one is not possible. */
const readOnly: PassportState = {
  name: "readonly",
  mark: { kind: "attribute", name: "data-readonly" },
};

/** Pointer is over this item. Zag tracks the pointer itself (`onPointerMove`/`onPointerLeave` on `item`), not the browser. */
const hover: PassportState = {
  name: "hover",
  mark: { kind: "attribute", name: "data-hover" },
};

/** This item is being pressed. `itemControl` ONLY — `item`/`itemText` never carry it. */
const active: PassportState = {
  name: "active",
  mark: { kind: "attribute", name: "data-active" },
};

/** Focus, MIRRORED from the item's hidden input onto the parts that cannot receive it themselves. */
const focus: PassportState = {
  name: "focus",
  mark: { kind: "attribute", name: "data-focus" },
};

/** Keyboard focus — the same mirrored device, a separate name: `:focus-visible` would aim at nothing. */
const focusVisible: PassportState = {
  name: "focus-visible",
  mark: { kind: "attribute", name: "data-focus-visible" },
};

/** Shared by `root`/`label` — the group's own facts, not any one item's. */
const groupStates: readonly PassportState[] = [disabled, invalid, required];

/** Shared by `item`/`itemText`/`itemControl` — one item's own facts (`getItemDataAttrs`). */
const itemStates: readonly PassportState[] = [
  checked,
  unchecked,
  disabled,
  readOnly,
  invalid,
  hover,
  focus,
  focusVisible,
];

/**
 * Passport of the radio group — anatomy plus what anatomy alone does not say.
 *
 * Root draws its own node (unlike the popover's): `getRootProps()` returns a real wrapping
 * element, so `root: "root"` needs no special case.
 */
export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    { name: "root", states: groupStates },
    { name: "label", states: groupStates },
    { name: "item", states: itemStates },
    { name: "itemText", states: itemStates },
    { name: "itemControl", states: [...itemStates, active] },
    {
      name: "indicator",
      states: [disabled],
      variables: [
        { name: "--left", setBy: "kit" },
        { name: "--top", setBy: "kit" },
        { name: "--width", setBy: "kit" },
        { name: "--height", setBy: "kit" },
      ],
    },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  // ONE setting from the closed vocabulary applies: `orientation` — same name, same shape as the
  // tabs' own, but a DIFFERENT default: the machine's own `props()` default is `"vertical"`
  // (`radio-group.machine.mjs`), not `"horizontal"` — checked live, not assumed from the tabs'
  // precedent. `disabled`/`invalid`/`required` are excluded the same way the checkbox excludes
  // them: already declared as STATES above (a form fact, not an author's choice of look).
  settings: defineSettings<RadioGroupProps>({
    orientation: {
      values: {
        kind: "choice",
        options: [{ value: "horizontal" }, { value: "vertical" }],
      },
      byDefault: "vertical",
      mark: { kind: "attribute", name: "data-orientation" },
    },
  }),
});
