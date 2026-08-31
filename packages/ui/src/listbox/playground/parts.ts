// EDITOR-ONLY per-part taxonomy for the listbox — read by `./index.ts`'s `defineEditorInfo` call.
// Same physical shape as every other component's `playground/parts.ts` (`PWEB-127`): one file,
// exhaustive over the anatomy, `accepts`/state KEYS true to the real Ark composition read while
// building `../entity/`.
//
// Every part key, every state key (matches `../entity/passport.ts` exactly — `defineEditorInfo`
// throws otherwise), and every `accepts` rule (mirrors Ark's own anatomy example plus the
// `filtering` example, both read from the doc: `root` wraps `label` + `input` + `content` +
// `valueText`; `content` wraps EITHER `itemGroup` (holding `itemGroupLabel` + `item`s) OR
// `item`s directly, plus `empty`; `item` wraps `itemText` + `itemIndicator`) is real.

import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
// TYPE ONLY — see `assemblies.ts` for why: `typeof passport` needs the binding's TYPE, not the
// module's side effects.
import type { passport } from "../entity/passport.js";

type ListboxPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const disabledMeans = {
  disabled: { means: "the whole listbox is disabled" },
} satisfies PassportPartEditorInfo<ListboxPart>["states"];

const selectionMeans = {
  checked: { means: "this item is selected" },
  unchecked: { means: "this item is not selected" },
  highlighted: { means: "keyboard or pointer moved to this item, not yet chosen" },
  disabled: { means: "the whole listbox is disabled" },
} satisfies PassportPartEditorInfo<ListboxPart>["states"];

export const parts: Readonly<Record<ListboxPart, PassportPartEditorInfo<ListboxPart>>> = {
  root: {
    means: "the listbox as a whole — label, filter input, and the item list together",
    states: disabledMeans,
    accepts: [
      { kind: "component", name: "label" },
      { kind: "component", name: "input" },
      { kind: "component", name: "content" },
      { kind: "component", name: "valueText" },
    ],
  },
  label: {
    means: "the listbox's own label",
    states: disabledMeans,
    accepts: [{ kind: "content", genus: "text" }],
  },
  input: {
    means: "optional filter/search text field — narrows which items show",
    states: disabledMeans,
    // A real `<input>`, occupied by the consumer's own value/filter wiring — nothing nests inside
    // it (same category as the select's own `hiddenSelect`/the switch's own `hiddenInput`).
    accepts: [],
  },
  content: {
    means: "wraps the items — the scrollable/navigable region, always in the document",
    states: { empty: { means: "there are no items to show" } },
    accepts: [
      { kind: "component", name: "itemGroup" },
      { kind: "component", name: "item" },
      { kind: "component", name: "empty" },
    ],
  },
  itemGroup: {
    means: "groups related items under one label",
    states: { ...disabledMeans, empty: { means: "this group has no items" } },
    accepts: [
      { kind: "component", name: "itemGroupLabel" },
      { kind: "component", name: "item" },
    ],
  },
  itemGroupLabel: {
    means: "label of an item group",
    states: {},
    accepts: [{ kind: "content", genus: "text" }],
  },
  item: {
    means: "one selectable option",
    states: selectionMeans,
    accepts: [
      { kind: "component", name: "itemText" },
      { kind: "component", name: "itemIndicator" },
    ],
  },
  itemText: {
    means: "an item's visible label",
    states: selectionMeans,
    accepts: [{ kind: "content", genus: "text" }],
  },
  itemIndicator: {
    means: "selected-item indicator — a checkmark placed by the consumer",
    states: {
      checked: { means: "this item is selected" },
      unchecked: { means: "this item is not selected" },
    },
    // Occupied — the consumer places the checkmark, same as the select's own item indicator.
    accepts: [{ kind: "content", genus: "icon" }],
  },
  valueText: {
    means: "shows the selected value(s) as a comma-separated string, or the placeholder",
    states: disabledMeans,
    accepts: [],
  },
  empty: {
    means: "shown only while the collection is empty",
    states: {},
    accepts: [{ kind: "content", genus: "text" }],
  },
};
