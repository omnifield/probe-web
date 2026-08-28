// EDITOR-ONLY per-part taxonomy for the radio group — read by `./index.ts`'s `defineEditorInfo`
// call. Same physical shape as every other component's `playground/parts.ts` (`PWEB-127`): one
// file, exhaustive over the anatomy, `accepts`/state KEYS true to the real Ark composition.
//
// `root`'s `accepts` (root wraps label + item + indicator, indicator a direct sibling of the
// items, not nested in any one `itemControl`) matches Ark's own documented anatomy exactly
// (`ark-ui.com/docs/components/radio-group`, checked via the `ark-ui` MCP, 2026-08-26) — the
// template's guess needed no correction here, unlike the carousel's own `autoplayTrigger`.

import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../entity/passport.js";

type RadioGroupPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

// `root`/`label` share the GROUP's own three states; `item`/`itemText`/`itemControl` share the
// PER-ITEM eight, `itemControl` alone adding `active` — mirrors `../entity/passport.ts`'s own
// `groupStates`/`itemStates` split.
const groupStateMeans = {
  disabled: { means: "the whole group is disabled — no item can be chosen" },
  invalid: { means: "the enclosing form rejected the value" },
  required: { means: "the form will demand a choice on submit" },
} satisfies PassportPartEditorInfo<RadioGroupPart>["states"];

const itemStateMeans = {
  checked: { means: "this is the chosen item" },
  unchecked: { means: "not the chosen item" },
  disabled: { means: "this item cannot be chosen — its own flag, or the whole group's" },
  readonly: { means: "the value is visible but nothing can be chosen" },
  invalid: { means: "the enclosing form rejected the value" },
  hover: { means: "pointer is over this item" },
  focus: { means: "keyboard or pointer focus is on this item's hidden input — mirrored here since the input itself is invisible" },
  "focus-visible": { means: "focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise" },
} satisfies PassportPartEditorInfo<RadioGroupPart>["states"];

export const parts: Readonly<Record<RadioGroupPart, PassportPartEditorInfo<RadioGroupPart>>> = {
  root: {
    means: "the whole set — the group of choices where exactly one can be picked",
    states: groupStateMeans,
    accepts: [
      { kind: "component", name: "label" },
      { kind: "component", name: "item" },
      { kind: "component", name: "indicator" },
    ],
  },
  label: {
    means: "the set's own label — describes the whole group, not any one choice",
    states: groupStateMeans,
    accepts: [{ kind: "content", genus: "text" }],
  },
  item: {
    means: "one choice — a clickable row; click anywhere on it to select",
    states: itemStateMeans,
    accepts: [
      { kind: "component", name: "itemControl" },
      { kind: "component", name: "itemText" },
      // The real hidden `<input type="radio">` (`PWEB-152`) — no address of its own, but the
      // node the real `onChange` lives on; without it a preview looks right and never selects.
      { kind: "component", name: "hiddenInput" },
    ],
  },
  itemText: {
    means: "this item's own label text",
    states: itemStateMeans,
    accepts: [{ kind: "content", genus: "text" }],
  },
  itemControl: {
    means: "the visible circle — what the sliding indicator centers itself on top of when this item is chosen",
    states: { ...itemStateMeans, active: { means: "this item's circle is being pressed" } },
    // Occupied — a plain ring, no consumer content in Ark's own documented usage.
    accepts: [],
  },
  indicator: {
    means: "the single sliding dot — jumps to sit over whichever item is currently checked",
    states: { disabled: { means: "the whole group is disabled" } },
    variables: {
      "--left": { means: "measured horizontal position of the checked item's circle" },
      "--top": { means: "measured vertical position of the checked item's circle" },
      "--width": { means: "measured width of the checked item's circle" },
      "--height": { means: "measured height of the checked item's circle" },
    },
    // Occupied — a pure positioning box, no consumer content.
    accepts: [],
  },
};
