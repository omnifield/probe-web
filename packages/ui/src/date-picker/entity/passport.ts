// RUNTIME passport of the date picker — anatomy (`anatomy.ts`) plus everything else the running
// app needs: per-part STATES and the variant axis, tied together by `definePassport`. The
// biggest passport in the kit — 25 parts, one of them (`tableCellTrigger`) carrying more states
// than any other part in the kit has ever needed.
//
// THIS FILE IS RUNTIME ONLY, same as the anatomy it builds on — it ships in the app bundle.
// Editor-facing metadata lives in `playground/index.ts` instead; that file depends on this one,
// never the other way.
//
// Every mark below was read from `@zag-js/date-picker/date-picker.connect.mjs` (927 lines, read
// in full, not sampled) — the same rigor the rest of the kit's passports read from a `.connect.mjs`.
//
// ## `data-view` reaches TEN parts — one shared three-valued state, not ten repeated booleans
//
// `table`/`tableHead`/`tableHeader`/`tableBody`/`tableRow`/`tableCell`/`tableCellTrigger`/`view`/
// `viewControl`/`viewTrigger` all carry `data-view` with the SAME three values (`"day"`/`"month"`/
// `"year"`) — checked on every one of their `getXxxProps` functions. The same device the tabs'
// own `orientation` setting and the checkbox's own `checked`/`unchecked`/`indeterminate` already
// use for one shared attribute with more than two values — here it is a STATE, not a SETTING:
// `view` is not one of the closed vocabulary's three names (`orientation`/`multiple`/
// `collapsible`), and it changes at RUNTIME (clicking `viewTrigger`), not something an author
// fixes once in the editor.
//
// ## `tableCellTrigger` — the richest part in the kit, by a wide margin
//
// Twenty states: the three `view` values: eight shared across every view (`disabled`/
// `selectable`/`selected`/`focus`/`outside-range`/`range-start`/`range-end`/`in-range`); three
// hover-preview-only ones, real but only ever true in `selectionMode="range"` (`in-hover-range`/
// `hover-range-start`/`hover-range-end` — the attribute keys are always present, `dataAttr(false)`
// just omits them outside range mode, the same "real state, narrow condition" category the
// checkbox's own `indeterminate` already is); three DAY-VIEW-ONLY ones absent from the month/year
// cell triggers entirely (`today`/`unavailable`/`weekend`); and three genuine pseudo-classes
// (`hover`/`focus-visible`/`active`) — `role="button"` on a `<div>`
// (`@ark-ui/solid/date-picker`'s own `DatePickerTableCellTriggerBaseProps extends
// PolymorphicProps<'div'>`), not a real `<button>`, but still a real DOM node the browser hovers/
// presses/focuses (roving `tabIndex`) the ordinary way — no JS pointer tracking overrides that for
// hover/press, only for the range-preview attributes above.
//
// ## `tableCell`'s `selected` is NOT symmetric across views — a real Zag inconsistency, not a slip here
//
// `getDayTableCellProps` writes `aria-selected` but NEVER `data-selected`; `getMonthTableCellProps`/
// `getYearTableCellProps` both write `data-selected` in addition. Declared once on `tableCell`
// (the same part serves all three views) — absent in the day view is named in its own comment
// below, not hidden.
//
// ## `weekNumberCell`/`weekNumberHeaderCell` carry NO states of their own — they draw with `tableCell`'s
//
// `getWeekNumberCellProps`/`getWeekNumberHeaderCellProps` spread `parts.tableCell.attrs`, not a
// part of their own (`../entity/anatomy.ts`) — `tableCell`'s own (thin) state list already covers
// what they can show; a second, parallel declaration would drift from it silently.
//
// ## `positioner`'s geometry variables — the SAME popper mechanism as the popover's/select's
//
// `getPositionerProps` calls the SAME `@zag-js/popper` `getPlacementStyles`/tracking the popover's
// own positioner already stands on (`popover/entity/passport.ts`) — the same four custom
// properties, checked in `@zag-js/popper/get-placement.mjs` directly (not assumed from that
// precedent): `--reference-width`/`--reference-height` size the floating content against its
// control, `--available-width`/`--available-height` cap it against the viewport.
//
// ## `valueText` has NO `getXxxProps` at all — the only part in the kit addressed OUTSIDE the connector
//
// `date-picker.connect.mjs` never mentions `valueText`; its address comes from
// `@ark-ui/solid/date-picker`'s own `DatePickerValueText` component spreading
// `datePickerAnatomy.build().valueText.attrs` directly (`../entity/anatomy.ts`'s own header
// explains the `.extendWith(...)` this comes from). No states: nothing computes a look-relevant
// fact for it beyond the text itself.
//
// ## `data-placement`/`data-side`/`data-index` — excluded, the same categories as elsewhere
//
// `content`/`trigger` carry `data-placement`/`data-side` — positioning internals, not a
// skin-facing hook, the exact exclusion the popover's own passport already makes for the same two
// attributes. `label`/`input` carry `data-index` (which of several inputs, in range/multiple
// mode) — identity, not look, the same category as the tabs' own excluded `data-value`.
//
// ## Native `disabled`/`readOnly`/`required` — pseudo where NOT also mirrored by a data attribute
//
// `trigger`/`monthSelect`/`yearSelect`/`input` set native `disabled` (input also `readOnly`/
// `required`) with NO matching `data-*` twin — pseudo-classes, the plain button's own reasoning.
// `root`/`label`/`control`/`nextTrigger`/`prevTrigger`/`viewTrigger`/`tableHead`/`tableHeader`/
// `tableBody`/`tableRow`/`tableCellTrigger` all get an EXPLICIT `data-disabled` (some alongside a
// redundant native `disabled` too) — the mark that is explicitly emitted is the one declared, the
// tabs' own trigger's own rule for exactly this choice. `clearTrigger`/`presetTrigger` have NO
// disabled concept in the connector AT ALL (checked — neither sets it, native or data) and none is
// invented here.

import { defineSettings, definePassport, type PassportState } from "@omnifield/probe-web-skin/model";
// TYPE ONLY: `import type` is erased at build time entirely, and the `./passport` subpath stays
// what it is sold as — data with no Solid. Needed only so the setting keys are checked against
// the component's real props.
import type { DatePickerProps } from "../components/index.js";
import { anatomy } from "./anatomy.js";

/** Open — the calendar panel is showing. Shared by `root`/`label`/`content`/`trigger`/`input`. */
const open = {
  name: "open",
  mark: { kind: "attribute", name: "data-state", value: "open" },
} as const satisfies PassportState;

/** Closed — the same attribute, the other value. */
const closed = {
  name: "closed",
  mark: { kind: "attribute", name: "data-state", value: "closed" },
} as const satisfies PassportState;

const openClosed: readonly PassportState[] = [open, closed];

/** No value selected yet. Mark NAME differs per part (`data-empty` on `root`, `data-placeholder-shown` elsewhere) — same fact, different attribute, checked on each part rather than assumed uniform. */
const emptyRoot = { name: "empty", mark: { kind: "attribute", name: "data-empty" } } as const satisfies PassportState;
const emptyPlaceholder = {
  name: "empty",
  mark: { kind: "attribute", name: "data-placeholder-shown" },
} as const satisfies PassportState;

/** Currently showing the day / month / year grid — one shared attribute, three values, TEN parts. */
const dayView = { name: "day", mark: { kind: "attribute", name: "data-view", value: "day" } } as const satisfies PassportState;
const monthView = {
  name: "month",
  mark: { kind: "attribute", name: "data-view", value: "month" },
} as const satisfies PassportState;
const yearView = { name: "year", mark: { kind: "attribute", name: "data-view", value: "year" } } as const satisfies PassportState;
const viewStates: readonly PassportState[] = [dayView, monthView, yearView];

/** Explicit `data-disabled` — declared per-part below only where the connector actually emits it. */
const disabledData = { name: "disabled", mark: { kind: "attribute", name: "data-disabled" } } as const satisfies PassportState;

/** Native-only `disabled`/`readOnly`/`required` — no `data-*` twin on these parts, so the honest mark is the pseudo-class. */
const disabledPseudo = { name: "disabled", mark: { kind: "pseudo", name: ":disabled" } } as const satisfies PassportState;
const hoverPseudo = { name: "hover", mark: { kind: "pseudo", name: ":hover" } } as const satisfies PassportState;
const focusVisiblePseudo = { name: "focus-visible", mark: { kind: "pseudo", name: ":focus-visible" } } as const satisfies PassportState;
const activePseudo = { name: "active", mark: { kind: "pseudo", name: ":active" } } as const satisfies PassportState;

/** A genuine button's pointer/keyboard trio — no JS pointer tracking overrides these, the plain button's own reasoning. */
const buttonPseudos: readonly PassportState[] = [hoverPseudo, focusVisiblePseudo, activePseudo];

/** Shared by every `tableXxx` structural row/section part: `data-view` plus a group-level `data-disabled`. */
const tableSectionStates: readonly PassportState[] = [...viewStates, disabledData];

// tableCellTrigger's own dictionary — see the file header ("the richest part in the kit").
const selectable = { name: "selectable", mark: { kind: "attribute", name: "data-selectable" } } as const satisfies PassportState;
const selected = { name: "selected", mark: { kind: "attribute", name: "data-selected" } } as const satisfies PassportState;
const focus = { name: "focus", mark: { kind: "attribute", name: "data-focus" } } as const satisfies PassportState;
const outsideRange = {
  name: "outside-range",
  mark: { kind: "attribute", name: "data-outside-range" },
} as const satisfies PassportState;
const rangeStart = { name: "range-start", mark: { kind: "attribute", name: "data-range-start" } } as const satisfies PassportState;
const rangeEnd = { name: "range-end", mark: { kind: "attribute", name: "data-range-end" } } as const satisfies PassportState;
const inRange = { name: "in-range", mark: { kind: "attribute", name: "data-in-range" } } as const satisfies PassportState;
/** Real only under `selectionMode="range"` — the attribute key is always present, just always absent otherwise. */
const inHoverRange = {
  name: "in-hover-range",
  mark: { kind: "attribute", name: "data-in-hover-range" },
} as const satisfies PassportState;
const hoverRangeStart = {
  name: "hover-range-start",
  mark: { kind: "attribute", name: "data-hover-range-start" },
} as const satisfies PassportState;
const hoverRangeEnd = {
  name: "hover-range-end",
  mark: { kind: "attribute", name: "data-hover-range-end" },
} as const satisfies PassportState;
/** DAY VIEW ONLY — absent entirely from the month/year cell triggers, not just false. */
const today = { name: "today", mark: { kind: "attribute", name: "data-today" } } as const satisfies PassportState;
const unavailable = { name: "unavailable", mark: { kind: "attribute", name: "data-unavailable" } } as const satisfies PassportState;
const weekend = { name: "weekend", mark: { kind: "attribute", name: "data-weekend" } } as const satisfies PassportState;

const tableCellTriggerStates: readonly PassportState[] = [
  ...viewStates,
  disabledData,
  selectable,
  selected,
  focus,
  outsideRange,
  rangeStart,
  rangeEnd,
  inRange,
  inHoverRange,
  hoverRangeStart,
  hoverRangeEnd,
  today,
  unavailable,
  weekend,
  ...buttonPseudos,
];

/** Passport of the date picker — anatomy plus what anatomy alone does not say. */
export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    { name: "root", states: [...openClosed, disabledData, { name: "readonly", mark: { kind: "attribute", name: "data-readonly" } }, emptyRoot] },
    { name: "label", states: [...openClosed, disabledData, { name: "readonly", mark: { kind: "attribute", name: "data-readonly" } }] },
    { name: "control", states: [disabledData, emptyPlaceholder] },
    {
      name: "input",
      states: [
        ...openClosed,
        emptyPlaceholder,
        { name: "invalid", mark: { kind: "attribute", name: "data-invalid" } },
        disabledPseudo,
        { name: "readonly", mark: { kind: "pseudo", name: ":read-only" } },
        { name: "required", mark: { kind: "pseudo", name: ":required" } },
      ],
    },
    { name: "clearTrigger", states: buttonPseudos },
    { name: "trigger", states: [...openClosed, emptyPlaceholder, disabledPseudo] },
    { name: "content", states: [...openClosed, { name: "inline", mark: { kind: "attribute", name: "data-inline" } }] },
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
    { name: "view", states: viewStates },
    { name: "viewControl", states: viewStates },
    { name: "viewTrigger", states: [...viewStates, disabledData] },
    { name: "rangeText", states: [] },
    { name: "prevTrigger", states: [disabledData] },
    { name: "nextTrigger", states: [disabledData] },
    { name: "monthSelect", states: [disabledPseudo] },
    { name: "yearSelect", states: [disabledPseudo] },
    { name: "table", states: tableSectionStates },
    { name: "tableHead", states: tableSectionStates },
    { name: "tableHeader", states: tableSectionStates },
    { name: "tableBody", states: tableSectionStates },
    { name: "tableRow", states: tableSectionStates },
    // `selected` is real only in the month/year views — see the file header's own section on it.
    { name: "tableCell", states: [...viewStates, selected] },
    { name: "tableCellTrigger", states: tableCellTriggerStates },
    { name: "presetTrigger", states: buttonPseudos },
    { name: "valueText", states: [] },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  // NO settings from the closed vocabulary apply: `selectionMode` is a real three-way prop
  // (`single`/`multiple`/`range`) but its NAME is not `"multiple"` — `defineSettings`'s own
  // `Extract<keyof Props, PassportSettingName>` filters it out by construction, the same empty
  // result the plain button's and the popover's own settings already show.
  settings: defineSettings<DatePickerProps>()({}),
});
