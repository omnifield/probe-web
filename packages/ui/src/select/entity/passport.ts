// RUNTIME passport of the select — anatomy (`anatomy.ts`) plus everything else the running app
// needs: per-part STATES, the variant axis, and SETTINGS, tied together by `definePassport`.
//
// THIS FILE IS RUNTIME ONLY, same as the anatomy it builds on — it ships in the app bundle.
// Editor-facing metadata (`means`, group, genus, nesting/`accepts` rules) lives in
// `playground/index.ts` instead; that file depends on this one, never the other way.
//
// Every mark below was read from `@zag-js/select/select.connect.mjs` (`getRootProps`,
// `getControlProps`, …) — the same rigor the accordion's passport asks for ("states were taken
// from a live node, not from documentation"): the component's own doc page lists a few marks
// that the connector does not actually set (`data-highlighted` on `itemIndicator`, for one — the
// prose lists it, the connector does not), and a few it sets that the prose never mentions
// (`data-focus` mirrored onto `control`/`valueText` from the trigger's real focus, `data-invalid`
// reaching the `clearTrigger`). Read the source, not the docs, and this passport is the record of
// that reading.
//
// ## `data-state` is unconditional here, unlike the accordion's `item`
//
// The accordion's `item`/`itemTrigger`/`itemIndicator` carry `data-state="open"` ONLY when
// expanded — the mark is simply absent otherwise, which is why that passport declares `open`
// alone, no `closed`. The select's `control`/`trigger`/`indicator`/`content` are different: the
// connector writes `"data-state": open ? "open" : "closed"` unconditionally
// (`select.connect.mjs`) — the attribute is ALWAYS present, with one of two values. That is the
// same shape as the accordion's `itemContent`, which is why these four parts below declare BOTH
// `open` and `closed`, not `open` alone.
//
// ## Real DOM focus lives on the trigger, and is mirrored as data — same finding as the checkbox
//
// `trigger` is a genuine `<button>` (`normalize.button`, `getTriggerProps`) and gets real
// `:hover`/`:focus-visible`/`:active` from the browser, the same as the plain button. But focus
// is also mirrored as `data-focus` onto `control` and `valueText` — sibling nodes that cannot
// receive DOM focus themselves — so a rule addressing "the control while its trigger is focused"
// has something to attach to. This is the same device the checkbox's passport already names for
// its own hidden input.
//
// ## `disabled` picks the DATA mark over the native one, where both exist
//
// `trigger` carries BOTH a real `disabled` attribute (passed straight to `normalize.button`) and
// `"data-disabled": dataAttr(disabled)`. Declaring the attribute, not `:disabled`, matches the
// button's own passport (Kobalte sets a real `disabled` there too, and the attribute is still
// the one declared) — one canonical mark per state, and the data attribute is preferred whenever
// the provider actually emits one. `clearTrigger`, by contrast, gets ONLY the native `disabled` —
// `getClearTriggerProps` never sets `data-disabled` on it — so its disabledness is declared as
// `:disabled`, honestly reflecting what the connector actually does.
//
// ## Three marks named in the docs that are NOT declared here, on purpose
//
// `data-placement`/`data-side` (on `trigger`/`content`) and `data-activedescendant` (on
// `content`) are real attributes the connector sets, but their values are not a closed, author-
// chosen set the way `data-orientation`'s `"vertical" | "horizontal"` is — they are floating-ui
// placement outcomes and an ARIA wiring detail, decided by available viewport space, not by
// whoever writes the skin. `PassportState.mark` names ONE fixed value; there is no honest fixed
// value to give these. Declaring them would mean inventing a vocabulary the passport model does
// not have a field for yet — a finding for the architect, not a decision made quietly here.
// `data-value` on `item` is excluded for the same kind of reason: it identifies WHICH item, not
// how it looks — the same category `AccordionItem`'s `value` prop already stands outside the
// passport for.

import {
  defineSettings,
  definePassport,
  type PassportState,
} from "@omnifield/probe-web-skin/model";
// TYPE ONLY: `import type` is erased at build time entirely, and the `./passport` subpath stays
// what it is sold as — data with no Solid and no Ark. Needed only so the setting keys are
// checked against the component's real props.
import type { SelectProps } from "../components/index.js";
import { anatomy } from "./anatomy.js";

/** Open — the set's floating content is shown. Unconditional: the sibling value is `closed`. */
const open = {
  name: "open",
  mark: { kind: "attribute", name: "data-state", value: "open" },
} as const satisfies PassportState;

/** Closed — the same attribute, the other value. Always one or the other, never absent. */
const closed = {
  name: "closed",
  mark: { kind: "attribute", name: "data-state", value: "closed" },
} as const satisfies PassportState;

/** Disabled, expressed as data — the mark `trigger` carries ALONGSIDE its native `disabled`. */
const disabled = {
  name: "disabled",
  mark: { kind: "attribute", name: "data-disabled" },
} as const satisfies PassportState;

/** Invalid — the enclosing form rejected the value; the select cannot say why, only that. */
const invalid = {
  name: "invalid",
  mark: { kind: "attribute", name: "data-invalid" },
} as const satisfies PassportState;

/** Read-only — the value is visible, choosing a different one is not possible. */
const readOnly = {
  name: "readonly",
  mark: { kind: "attribute", name: "data-readonly" },
} as const satisfies PassportState;

/** Required — the form will demand a value on submit. */
const required = {
  name: "required",
  mark: { kind: "attribute", name: "data-required" },
} as const satisfies PassportState;

/** Focus, MIRRORED from the trigger's real DOM focus onto a sibling that cannot receive it itself. */
const focus = {
  name: "focus",
  mark: { kind: "attribute", name: "data-focus" },
} as const satisfies PassportState;

/** Passport of the select — anatomy plus what anatomy alone does not say. */
export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    {
      // No `data-disabled` here (`getRootProps`, `select.connect.mjs`): disabledness is only
      // ever surfaced on the parts that actually carry the look for it.
      name: "root",
      states: [invalid, readOnly],
    },
    { name: "label", states: [disabled, invalid, readOnly, required] },
    { name: "control", states: [open, closed, focus, disabled, invalid] },
    { name: "valueText", states: [disabled, invalid, focus] },
    {
      name: "trigger",
      states: [
        open,
        closed,
        disabled,
        invalid,
        readOnly,
        // "No value chosen yet" — the placeholder text is showing. `dataAttr(!hasSelectedItems)`,
        // present only while true.
        { name: "placeholder", mark: { kind: "attribute", name: "data-placeholder-shown" } },
        // A genuine `<button>` (`normalize.button`) — the browser knows these, not the component,
        // same reasoning as the plain button's own passport.
        { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
        { name: "focus-visible", mark: { kind: "pseudo", name: ":focus-visible" } },
        { name: "active", mark: { kind: "pseudo", name: ":active" } },
      ],
    },
    {
      name: "clearTrigger",
      states: [
        invalid,
        // Native ONLY here — `getClearTriggerProps` never writes `data-disabled` (unlike
        // `trigger`), so the attribute mark would be a lie about what the connector does.
        { name: "disabled", mark: { kind: "pseudo", name: ":disabled" } },
        { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
        { name: "focus-visible", mark: { kind: "pseudo", name: ":focus-visible" } },
        { name: "active", mark: { kind: "pseudo", name: ":active" } },
      ],
    },
    { name: "indicator", states: [open, closed, disabled, invalid, readOnly] },
    {
      name: "positioner",
      states: [],
      // The floating content's measured room to work with (`@zag-js/popper`, `get-placement.mjs`)
      // — checked in the popper's own source, the same rigor the accordion's `--height` asks for:
      // it sets exactly these four custom properties on the positioner node, nothing else that
      // belongs to a skin author. `--x`/`--y`/`--z-index` are excluded on purpose: those position
      // the floating node itself (the popper's own placement mechanics), not a hook for a skin to
      // style with — the same category of exclusion as `data-placement` above.
      variables: [
        { name: "--reference-width", setBy: "kit" },
        { name: "--reference-height", setBy: "kit" },
        { name: "--available-width", setBy: "kit" },
        { name: "--available-height", setBy: "kit" },
      ],
    },
    { name: "content", states: [open, closed] },
    // No states at all (`getListProps`, `select.connect.mjs`) — role and aria wiring only.
    { name: "list", states: [] },
    { name: "itemGroup", states: [disabled] },
    // No states at all (`getItemGroupLabelProps`) — id, role, and dir only.
    { name: "itemGroupLabel", states: [] },
    {
      name: "item",
      states: [
        { name: "checked", mark: { kind: "attribute", name: "data-state", value: "checked" } },
        { name: "unchecked", mark: { kind: "attribute", name: "data-state", value: "unchecked" } },
        { name: "highlighted", mark: { kind: "attribute", name: "data-highlighted" } },
        disabled,
      ],
    },
    {
      name: "itemText",
      states: [
        { name: "checked", mark: { kind: "attribute", name: "data-state", value: "checked" } },
        { name: "unchecked", mark: { kind: "attribute", name: "data-state", value: "unchecked" } },
        { name: "highlighted", mark: { kind: "attribute", name: "data-highlighted" } },
        disabled,
      ],
    },
    {
      // `data-highlighted` is NOT here: `getItemIndicatorProps` sets only `data-state` (plus
      // `hidden`, not a look address, same as the checkbox's own indicator) — the doc page lists
      // highlighted for this part too, and the connector does not back it up.
      name: "itemIndicator",
      states: [
        { name: "checked", mark: { kind: "attribute", name: "data-state", value: "checked" } },
        { name: "unchecked", mark: { kind: "attribute", name: "data-state", value: "unchecked" } },
      ],
    },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  // ONE setting from the closed vocabulary applies: `multiple` (`PWEB-89`) — single vs. multi
  // selection changes behavior, markup, and aria the same way the accordion's own `multiple`
  // does, and carries no mark of its own: `select.connect.mjs` never spreads it as a data
  // attribute anywhere (it surfaces only in the JS-facing `multiple` field of the connector's
  // return value, and as a native attribute on the unaddressed hidden `<select>`). `disabled` /
  // `invalid` / `readOnly` / `required` are excluded the same way the checkbox excludes them:
  // already declared as STATES above, a form fact rather than a look an author picks.
  settings: defineSettings<SelectProps>()({
    multiple: { values: { kind: "flag" }, byDefault: false },
  }),
});
