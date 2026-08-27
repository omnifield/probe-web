// EDITOR-ONLY per-part taxonomy for the date picker — read by `./index.ts`'s `defineEditorInfo`
// call. Same physical shape as every other component's `playground/parts.ts` (`PWEB-127`).

import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../entity/passport.js";

type DatePickerPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

// Shared dictionaries, mirroring `../entity/passport.ts`'s own.
const openClosedMeans = {
  open: { means: "the calendar panel is showing" },
  closed: { means: "the calendar panel is hidden" },
} satisfies PassportPartEditorInfo<DatePickerPart>["states"];

const viewMeans = {
  day: { means: "showing the day grid — pick a date directly" },
  month: { means: "showing the month grid — pick a month, then drill into its days" },
  year: { means: "showing the year grid — pick a year, then drill into its months" },
} satisfies PassportPartEditorInfo<DatePickerPart>["states"];

const buttonPseudoMeans = {
  hover: { means: "pointer is over this button" },
  "focus-visible": { means: "focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise" },
  active: { means: "this button is being held down" },
} satisfies PassportPartEditorInfo<DatePickerPart>["states"];

const tableSectionMeans = {
  ...viewMeans,
  disabled: { means: "the whole picker is disabled" },
} satisfies PassportPartEditorInfo<DatePickerPart>["states"];

export const parts: Readonly<Record<DatePickerPart, PassportPartEditorInfo<DatePickerPart>>> = {
  root: {
    means: "the whole date picker — label, control, and the floating calendar together",
    states: {
      ...openClosedMeans,
      disabled: { means: "the whole picker is disabled" },
      readonly: { means: "the value is visible, changing it is not possible" },
      empty: { means: "no value is selected yet" },
    },
    accepts: [
      { kind: "part", name: "label" },
      { kind: "part", name: "control" },
      { kind: "part", name: "positioner" },
    ],
  },
  label: {
    means: "the picker's own label",
    states: {
      ...openClosedMeans,
      disabled: { means: "the whole picker is disabled" },
      readonly: { means: "the value is visible, changing it is not possible" },
    },
    accepts: [{ kind: "content", genus: "text" }],
  },
  control: {
    means: "wraps the input and the buttons that open/clear the picker — the row visible while closed",
    states: {
      disabled: { means: "the whole picker is disabled" },
      empty: { means: "no value is selected yet" },
    },
    accepts: [
      { kind: "part", name: "input" },
      { kind: "part", name: "trigger" },
      { kind: "part", name: "clearTrigger" },
    ],
  },
  input: {
    means: "the typed-date field — one per index in range/multiple mode",
    states: {
      ...openClosedMeans,
      empty: { means: "no value is selected yet" },
      invalid: { means: "the enclosing form rejected the value" },
      disabled: { means: "this input cannot be used" },
      readonly: { means: "the value is visible, changing it is not possible" },
      required: { means: "the form will demand a value on submit" },
    },
    accepts: [],
  },
  clearTrigger: {
    means: "clears the selected value — hidden by the kit while nothing is selected",
    states: buttonPseudoMeans,
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  trigger: {
    means: "opens or closes the calendar panel",
    states: { ...openClosedMeans, empty: { means: "no value is selected yet" }, disabled: { means: "this button cannot be used" } },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  content: {
    means: "the floating panel — holds every view",
    states: { ...openClosedMeans, inline: { means: "shown inline in the page flow, not floating over it" } },
    accepts: [{ kind: "part", name: "view" }],
  },
  positioner: {
    means: "positions the floating panel against the control — a pure wrapper, no look of its own",
    states: {},
    variables: {
      "--reference-width": { means: "measured width of the control the panel is anchored to" },
      "--reference-height": { means: "measured height of the control the panel is anchored to" },
      "--available-width": { means: "space left before the panel would hit the viewport edge" },
      "--available-height": { means: "space left before the panel would hit the viewport edge" },
    },
    accepts: [{ kind: "part", name: "content" }],
  },
  view: {
    means: "one view's panel (day, month, or year) — hidden while a different one is active",
    states: viewMeans,
    accepts: [
      { kind: "part", name: "viewControl" },
      { kind: "part", name: "table" },
    ],
  },
  viewControl: {
    means: "wraps a view's own prev/next/toggle row",
    states: viewMeans,
    accepts: [
      { kind: "part", name: "prevTrigger" },
      { kind: "part", name: "viewTrigger" },
      { kind: "part", name: "nextTrigger" },
    ],
  },
  viewTrigger: {
    means: "switches to the next-broader view (day → month → year)",
    states: { ...viewMeans, disabled: { means: "the whole picker is disabled" } },
    accepts: [
      { kind: "part", name: "rangeText" },
      { kind: "content", genus: "text" },
    ],
  },
  rangeText: {
    means: "the visible range's own label (e.g. a month name) — text set by the kit",
    states: {},
    accepts: [],
  },
  prevTrigger: {
    means: "steps the visible range backward",
    states: { disabled: { means: "there is nothing earlier to step to" } },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  nextTrigger: {
    means: "steps the visible range forward",
    states: { disabled: { means: "there is nothing later to step to" } },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  monthSelect: {
    means: "jumps the focused month directly — a native dropdown",
    states: { disabled: { means: "this control cannot be used" } },
    accepts: [],
  },
  yearSelect: {
    means: "jumps the focused year directly — a native dropdown",
    states: { disabled: { means: "this control cannot be used" } },
    accepts: [],
  },
  table: {
    means: "the calendar grid — one per view",
    states: tableSectionMeans,
    accepts: [
      { kind: "part", name: "tableHead" },
      { kind: "part", name: "tableBody" },
    ],
  },
  tableHead: {
    means: "wraps the grid's header row",
    states: tableSectionMeans,
    accepts: [{ kind: "part", name: "tableRow" }],
  },
  tableHeader: {
    means: "one column's own header cell (a weekday, in the day view)",
    states: tableSectionMeans,
    accepts: [{ kind: "content", genus: "text" }],
  },
  tableBody: {
    means: "wraps the grid's data rows",
    states: tableSectionMeans,
    accepts: [{ kind: "part", name: "tableRow" }],
  },
  tableRow: {
    // `tableRow` is ONE anatomy part shared by both the header row (inside `tableHead`, holding
    // `tableHeader`s) and every body row (inside `tableBody`, holding `tableCell`s) — the
    // template's own guess named only the second use; both belong here.
    means: "one row — either the weekday header row, or one week (day view) / one row of months/years (other views)",
    states: tableSectionMeans,
    accepts: [
      { kind: "part", name: "tableHeader" },
      { kind: "part", name: "tableCell" },
    ],
  },
  tableCell: {
    means: "one grid cell — wraps the clickable trigger inside it",
    // `selected` real only in month/year views — see `../entity/passport.ts`'s own note.
    states: { ...viewMeans, selected: { means: "this cell's own value is the one currently selected (month/year views only)" } },
    accepts: [{ kind: "part", name: "tableCellTrigger" }],
  },
  tableCellTrigger: {
    means: "the clickable surface inside a cell — picks that date/month/year",
    states: {
      ...viewMeans,
      disabled: { means: "this cell cannot be picked" },
      selectable: { means: "this cell CAN be picked at all — the baseline every other state here refines" },
      selected: { means: "this cell's own value is the one currently selected" },
      focus: { means: "keyboard roving focus is on this cell" },
      "outside-range": { means: "belongs to the adjacent month/year, shown only to fill out the grid" },
      "range-start": { means: "the first date of the selected range" },
      "range-end": { means: "the last date of the selected range" },
      "in-range": { means: "falls between the selected range's start and end" },
      "in-hover-range": { means: "falls between the range's start and wherever the pointer is hovering right now (range mode only)" },
      "hover-range-start": { means: "would become the range's start if clicked next (range mode only)" },
      "hover-range-end": { means: "would become the range's end if clicked next (range mode only)" },
      today: { means: "this cell is today's date (day view only)" },
      unavailable: { means: "this date cannot be picked, e.g. outside min/max (day view only)" },
      weekend: { means: "this cell falls on a weekend (day view only)" },
      ...buttonPseudoMeans,
    },
    accepts: [{ kind: "content", genus: "text" }],
  },
  presetTrigger: {
    means: "jumps straight to a named range (e.g. \"last 7 days\")",
    states: buttonPseudoMeans,
    accepts: [{ kind: "content", genus: "text" }],
  },
  valueText: {
    means: "shows the selected value(s) as text, formatted by the kit",
    states: {},
    accepts: [],
  },
};
