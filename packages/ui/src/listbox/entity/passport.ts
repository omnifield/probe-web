// RUNTIME passport of the listbox — anatomy (`anatomy.ts`) plus everything else the running app
// needs: per-part STATES, the variant axis, and SETTINGS, tied together by `definePassport`.
//
// THIS FILE IS RUNTIME ONLY, same as the anatomy it builds on — it ships in the app bundle.
// Editor-facing metadata (`means`, group, genus, nesting/`accepts` rules) lives in
// `playground/index.ts` instead; that file depends on this one, never the other way.
//
// Every mark below was read from `@zag-js/listbox/listbox.connect.mjs` (`getRootProps`,
// `getItemProps`, …) — the same rigor the select's own passport asks for: read the source, not
// the ark-ui.com prose, and this passport is the record of that reading.
//
// ## No `open`/`closed` anywhere — the select's central axis simply does not exist here
//
// The select's `control`/`trigger`/`indicator`/`content` all carry `data-state="open" | "closed"`
// because a select IS a floating dropdown with something to open. A listbox has no floating
// layer: `content` is always in the document, always interactive, and `listbox.connect.mjs` never
// writes `data-state` on `content`, `root`, or anywhere else that isn't the item's OWN selection
// state (see below). This is the defining structural difference between the two siblings, not an
// oversight of either passport.
//
// ## The item's selectedness carries TWO redundant marks — one is declared, one is not
//
// `getItemProps` writes BOTH `"data-selected": dataAttr(itemState.selected)` (present-only) AND
// `"data-state": itemState.selected ? "checked" : "unchecked"` (always one or the other) for the
// exact same fact. Declaring both would give a skin two independent-looking hooks for one truth,
// with no way to tell from the passport alone that they can never disagree. `data-state` is the
// one declared — Zag's own shared vocabulary attribute, the same one the select's own item uses
// for the same fact, and the one `itemText` ALSO carries (see below) — `data-selected` is a
// finding, not a second address.
//
// ## `disabled` on `input` picks the DATA mark over the native one, same reasoning as the select
//
// `getInputProps` passes BOTH a real `disabled` attribute (straight into `normalize.input`) AND
// `"data-disabled": dataAttr(disabled)`. The select's own passport already settled this exact
// shape for its `trigger`: declare the data attribute, not `:disabled`, whenever the connector
// actually emits one — native-only is reserved for parts that genuinely get nothing else
// (`getLabelProps`/`getValueTextProps` never emit a native `disabled` at all, only the data mark,
// so there is no second option to choose between for them).
//
// ## `itemIndicator` carries LESS than `item`/`itemText`, on purpose
//
// `getItemIndicatorProps` sets only `data-state` (plus `hidden`, not a look address, the same
// exclusion the select's own indicator and the accordion's own indicator both stand on) —
// `highlighted` and `disabled` are real states of the ITEM, never spread onto its indicator.
// Declaring them here would address a mark that never appears.
//
// ## Two marks read in the connector that are NOT declared here, on purpose
//
// `data-value` on `item` is excluded the same way the select's own passport excludes it: it
// identifies WHICH item, not how it looks. `data-layout` (`"grid" | "list"`, on `content` and
// `item`) is excluded the same way the select's own `data-placement`/`data-side` are: a real
// attribute the connector sets, but decided by which KIND of collection the consumer built
// (`createListCollection` vs `createGridCollection`), not a look a skin author picks for this
// component — the grid layout, when it is used, is a structural fact about the data, not a
// variant. A finding for the architect if grid-layout listboxes need their own look axis, not a
// decision made quietly here.

import {
  defineSettings,
  definePassport,
  type PassportState,
} from "@omnifield/probe-web-skin/model";
// TYPE ONLY: `import type` is erased at build time entirely, and the `./passport` subpath stays
// what it is sold as — data with no Solid and no Ark. Needed only so the setting keys are checked
// against the component's real props, not an idea of them.
import type { ListboxProps } from "../components/index.js";
import { anatomy } from "./anatomy.js";

/** Disabled, expressed as data — chosen over the native `disabled` wherever both exist. */
const disabled = {
  name: "disabled",
  mark: { kind: "attribute", name: "data-disabled" },
} as const satisfies PassportState;

/** The set is empty — no items in the collection. Arrives on `content` AND `itemGroup` alike. */
const empty = {
  name: "empty",
  mark: { kind: "attribute", name: "data-empty" },
} as const satisfies PassportState;

/** Selected — Zag's shared vocabulary attribute, chosen over the redundant `data-selected`. */
const checked = {
  name: "checked",
  mark: { kind: "attribute", name: "data-state", value: "checked" },
} as const satisfies PassportState;

/** Not selected — the same attribute, the other value. Always one or the other, never absent. */
const unchecked = {
  name: "unchecked",
  mark: { kind: "attribute", name: "data-state", value: "unchecked" },
} as const satisfies PassportState;

/** Keyboard/pointer navigation has landed on this item, independent of whether it is selected. */
const highlighted = {
  name: "highlighted",
  mark: { kind: "attribute", name: "data-highlighted" },
} as const satisfies PassportState;

/** Passport of the listbox — anatomy plus what anatomy alone does not say. */
export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    {
      // `getRootProps` (`listbox.connect.mjs`): dir, id, `data-orientation` (the SETTING's own
      // mark, not a state — see below), `data-disabled`. No `data-empty` here — Zag never spreads
      // it on the root, only on `content` and `itemGroup`.
      name: "root",
      states: [disabled],
    },
    {
      // `getLabelProps`: id, dir, `data-disabled` — no native `disabled` to choose over.
      name: "label",
      states: [disabled],
    },
    {
      // `getInputProps`: BOTH a native `disabled` and `data-disabled` — the data mark wins, same
      // reasoning as the select's own `trigger`.
      name: "input",
      states: [disabled],
    },
    {
      // `getContentProps`: role `listbox`, `data-orientation` (setting's mark), `data-layout`
      // (excluded, see file header), `data-empty`. No `data-disabled` — disabledness is never
      // surfaced on the content itself, only on `root`/`label`/`input`/the items.
      name: "content",
      states: [empty],
    },
    {
      // `getItemProps`: `data-value` (excluded), `data-state` checked/unchecked, `data-selected`
      // (excluded, redundant with `data-state`, see file header), `data-layout` (excluded),
      // `data-orientation` (setting's mark), `data-highlighted`, `data-disabled`.
      name: "item",
      states: [checked, unchecked, highlighted, disabled],
    },
    {
      // `getItemTextProps`: `data-state` checked/unchecked, `data-disabled`, `data-highlighted` —
      // the same three the item itself carries, mirrored onto its text node.
      name: "itemText",
      states: [checked, unchecked, highlighted, disabled],
    },
    {
      // `getItemIndicatorProps`: ONLY `data-state` (plus `hidden`, not a look address) —
      // `highlighted`/`disabled` are real, but never spread here, only on `item`/`itemText`.
      name: "itemIndicator",
      states: [checked, unchecked],
    },
    {
      // `getItemGroupProps`: `data-disabled`, `data-orientation` (setting's mark), `data-empty`,
      // id, `aria-labelledby`, role `group`, dir.
      name: "itemGroup",
      states: [disabled, empty],
    },
    {
      // `getItemGroupLabelProps`: id, dir, role `presentation` — no data state at all.
      name: "itemGroupLabel",
      states: [],
    },
    {
      // `getValueTextProps`: dir, `data-disabled` — no native `disabled` to choose over, the same
      // shape as `label`.
      name: "valueText",
      states: [disabled],
    },
    {
      // `ListboxEmpty` (`listbox-empty.tsx`, Ark's own Solid layer, not the Zag connector): mounts
      // ONLY while `collection.size === 0`, spreads `parts.empty.attrs` and nothing else — no
      // data-attribute state, because presence itself is the only fact this part ever carries.
      // Declaring a state here would invent a mark that never exists on the node.
      name: "empty",
      states: [],
    },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  // ONE setting from the closed vocabulary applies: `orientation` (`SETTINGS`,
  // `@omnifield/probe-web-skin/model`) — vertical vs. horizontal keyboard navigation, the same
  // axis the accordion's own passport already declares. Checked on the source, not assumed
  // symmetric with the accordion: the mark arrives on `root`/`content`/`item`/`itemGroup`, NOT on
  // every part (`label`/`input`/`itemText`/`itemIndicator`/`itemGroupLabel`/`valueText`/`empty`
  // never carry it) — unlike the accordion, where it was verified to reach every part.
  //
  // `selectionMode` (`"single" | "multiple" | "extended"`) is real (`ListboxProps`) but does not
  // fit the closed vocabulary's `multiple` name: that name means a plain boolean toggle (the
  // select's own `multiple` setting), and forcing a three-way prop into it would misrepresent
  // `extended` as either "on" or "off" — a finding for the architect (a `SETTINGS` entry for a
  // closed CHOICE, not a flag, does not exist yet), not a decision made quietly here.
  // `disabled` is excluded the same way the select excludes it: already declared as a STATE above.
  settings: defineSettings<ListboxProps>()({
    orientation: {
      values: {
        kind: "choice",
        options: [{ value: "vertical" }, { value: "horizontal" }],
      },
      byDefault: "vertical",
      mark: { kind: "attribute", name: "data-orientation" },
    },
  }),
});
