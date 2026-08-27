// RUNTIME passport of the segment group — anatomy (`anatomy.ts`) plus everything else the running
// app needs: per-part STATES, the variant axis, and SETTINGS, tied together by `definePassport`.
//
// THIS FILE IS RUNTIME ONLY, same as the anatomy it builds on — it ships in the app bundle.
// Editor-facing metadata lives in `playground/index.ts` instead; that file depends on this one,
// never the other way.
//
// EVERY MARK BELOW IS THE RADIO GROUP'S OWN (`../../radio-group/entity/passport.ts`, `PWEB-134`),
// not re-read from a separate connector: `../entity/anatomy.ts` establishes that segment group IS
// `@zag-js/radio-group`'s own machine, renamed — there is no second `.connect.mjs` to diverge
// from the radio group's. The state SHAPE (two dictionaries, not one shared list; `active`
// exclusive to `itemControl`; `indicator` stateless beyond `disabled` plus its measured position)
// is copied here, not re-derived, because copying it and re-deriving it would read the exact same
// source file and could only ever agree or drift silently — this file names that source instead.

import { defineSettings, definePassport, type PassportState } from "@omnifield/probe-web-skin/model";
// TYPE ONLY: `import type` is erased at build time entirely, and the `./passport` subpath stays
// what it is sold as — data with no Solid. Needed only so the setting keys are checked against
// the component's real props.
import type { SegmentGroupProps } from "../components/index.jsx";
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
 * Passport of the segment group — anatomy plus what anatomy alone does not say.
 *
 * Root draws its own node (unlike the popover's/dialog's): `getRootProps()` returns a real
 * wrapping element, so `root: "root"` needs no special case — the radio group's own note.
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
  // ONE setting from the closed vocabulary applies: `orientation` — same name, same shape, same
  // default (`"vertical"`, `radio-group.machine.mjs`'s own `props()` default) as the radio
  // group's own, because it is the exact same machine. `disabled`/`invalid`/`required` are
  // excluded the same way — already declared as STATES above.
  settings: defineSettings<SegmentGroupProps>({
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
