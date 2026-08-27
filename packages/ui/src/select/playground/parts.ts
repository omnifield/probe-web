// EDITOR-ONLY per-part taxonomy for the select — read by `./index.ts`'s `defineEditorInfo` call
// (split out `PWEB-127`, at the same time as the rest of the select — this component never had
// an inline version). Means, states, and nesting — the taxonomy half of the editor slice;
// scenario data (`assemblies.ts`) and setting prose (`settings.ts`) are the other two, split out
// the same way: the same physical shape as every other component's `playground/`, at fifteen
// parts instead of five.
//
// Nesting mirrors the anatomy's real Solid composition one level at a time — `root` holding
// `label`/`control`/`positioner`, `control` holding `trigger`/`clearTrigger`/`indicator`,
// `positioner` holding `content`, `content` holding items directly OR through `list` (see
// `../entity/anatomy.ts` for why `list` is here at all, undocumented as it is upstream).

import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
// TYPE ONLY — see `assemblies.ts` for why: `typeof passport` needs the binding's TYPE, not the
// module's side effects.
import type { passport } from "../entity/passport.js";

type SelectPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const parts: Readonly<Record<SelectPart, PassportPartEditorInfo<SelectPart>>> = {
  root: {
    means: "the select as a whole — label, control, and the floating dropdown together",
    states: {
      invalid: { means: "the select is invalid by the form's rules" },
      readonly: { means: "a value is visible but cannot be changed" },
    },
    accepts: [
      { kind: "part", name: "label" },
      { kind: "part", name: "control" },
      { kind: "part", name: "positioner" },
    ],
  },
  label: {
    means: "the select's label",
    states: {
      disabled: { means: "the select is disabled" },
      invalid: { means: "the select is invalid by the form's rules" },
      readonly: { means: "a value is visible but cannot be changed" },
      required: { means: "the form will demand a value on submit" },
    },
    accepts: [{ kind: "content", genus: "text" }],
  },
  control: {
    means: "wraps the trigger and its indicators — the visible box the trigger sits in",
    states: {
      open: { means: "the dropdown is open" },
      closed: { means: "the dropdown is closed" },
      focus: { means: "focus is on the trigger (mirrored here — the control itself cannot be focused)" },
      disabled: { means: "the select is disabled" },
      invalid: { means: "the select is invalid by the form's rules" },
    },
    accepts: [
      { kind: "part", name: "trigger" },
      { kind: "part", name: "clearTrigger" },
      { kind: "part", name: "indicator" },
    ],
  },
  trigger: {
    means: "the button that opens and closes the dropdown",
    states: {
      open: { means: "the dropdown is open" },
      closed: { means: "the dropdown is closed" },
      disabled: { means: "the select is disabled — the trigger does not respond" },
      invalid: { means: "the select is invalid by the form's rules" },
      readonly: { means: "a value is visible but cannot be changed" },
      placeholder: { means: "no value is chosen yet — the placeholder text is showing" },
      hover: { means: "pointer is over the trigger" },
      "focus-visible": { means: "focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise" },
      active: { means: "the trigger is being held down" },
    },
    // ValueText is the only thing that lives inside the trigger in Ark's own composition —
    // ClearTrigger and Indicator are the control's OTHER children, siblings of the trigger, not
    // inside it.
    accepts: [{ kind: "part", name: "valueText" }],
  },
  valueText: {
    means: "shows the selected value(s), or the placeholder when none is chosen",
    states: {
      disabled: { means: "the select is disabled" },
      invalid: { means: "the select is invalid by the form's rules" },
      focus: { means: "focus is on the trigger (mirrored here, same as on the control)" },
    },
    // Occupied by the kit's own computed text — the same reasoning as the icon's single part:
    // nothing is placed inside by the consumer.
    accepts: [],
  },
  clearTrigger: {
    means: "button that clears the current selection",
    states: {
      invalid: { means: "the select is invalid by the form's rules" },
      disabled: { means: "the select is disabled — clicking it does nothing" },
      hover: { means: "pointer is over the button" },
      "focus-visible": { means: "focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise" },
      active: { means: "the button is being held down" },
    },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  indicator: {
    means: "open/closed indicator — an arrow placed by the consumer",
    states: {
      open: { means: "the dropdown is open" },
      closed: { means: "the dropdown is closed" },
      disabled: { means: "the select is disabled" },
      invalid: { means: "the select is invalid by the form's rules" },
      readonly: { means: "a value is visible but cannot be changed" },
    },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  positioner: {
    means: "positions the floating dropdown relative to the trigger",
    variables: {
      "--reference-width": { means: "measured width of the trigger — lets the dropdown match it" },
      "--reference-height": { means: "measured height of the trigger" },
      "--available-width": { means: "room left to the nearest viewport edge, widthwise" },
      "--available-height": { means: "room left to the nearest viewport edge, heightwise — caps a long dropdown" },
    },
    accepts: [{ kind: "part", name: "content" }],
  },
  content: {
    means: "the floating dropdown itself — items live here, grouped or not",
    states: {
      open: { means: "the dropdown is open" },
      closed: { means: "the dropdown is closed" },
    },
    accepts: [
      { kind: "part", name: "list" },
      { kind: "part", name: "itemGroup" },
      { kind: "part", name: "item" },
    ],
  },
  list: {
    means: "an inner listbox region inside the content — an optional alternative to nesting items straight in it",
    accepts: [
      { kind: "part", name: "itemGroup" },
      { kind: "part", name: "item" },
    ],
  },
  itemGroup: {
    means: "groups related items under one label",
    states: {
      disabled: { means: "the select is disabled" },
    },
    accepts: [
      { kind: "part", name: "itemGroupLabel" },
      { kind: "part", name: "item" },
    ],
  },
  itemGroupLabel: {
    means: "label of an item group",
    accepts: [{ kind: "content", genus: "text" }],
  },
  item: {
    means: "one selectable option",
    states: {
      checked: { means: "the item is selected" },
      unchecked: { means: "the item is not selected" },
      highlighted: { means: "the item is highlighted — keyboard or pointer moved to it, not yet chosen" },
      disabled: { means: "the item cannot be selected" },
    },
    accepts: [
      { kind: "part", name: "itemText" },
      { kind: "part", name: "itemIndicator" },
    ],
  },
  itemText: {
    means: "an item's visible label",
    states: {
      checked: { means: "the item is selected" },
      unchecked: { means: "the item is not selected" },
      highlighted: { means: "the item is highlighted — keyboard or pointer moved to it, not yet chosen" },
      disabled: { means: "the item cannot be selected" },
    },
    accepts: [{ kind: "content", genus: "text" }],
  },
  itemIndicator: {
    means: "selected-item indicator — a checkmark placed by the consumer",
    states: {
      checked: { means: "the item is selected" },
      unchecked: { means: "the item is not selected" },
    },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
};
