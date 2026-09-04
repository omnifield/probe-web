import { defineSettings, definePassport, type PassportState } from "@web-core/skin/model";
import type { DatePickerProps } from "../components/index.js";
import { anatomy } from "./anatomy.js";

const open = {
  name: "open",
  mark: { kind: "attribute", name: "data-state", value: "open" },
} as const satisfies PassportState;

const closed = {
  name: "closed",
  mark: { kind: "attribute", name: "data-state", value: "closed" },
} as const satisfies PassportState;

const openClosed: readonly PassportState[] = [open, closed];

const emptyRoot = { name: "empty", mark: { kind: "attribute", name: "data-empty" } } as const satisfies PassportState;
const emptyPlaceholder = {
  name: "empty",
  mark: { kind: "attribute", name: "data-placeholder-shown" },
} as const satisfies PassportState;

const dayView = { name: "day", mark: { kind: "attribute", name: "data-view", value: "day" } } as const satisfies PassportState;
const monthView = {
  name: "month",
  mark: { kind: "attribute", name: "data-view", value: "month" },
} as const satisfies PassportState;
const yearView = { name: "year", mark: { kind: "attribute", name: "data-view", value: "year" } } as const satisfies PassportState;
const viewStates: readonly PassportState[] = [dayView, monthView, yearView];

const disabledData = { name: "disabled", mark: { kind: "attribute", name: "data-disabled" } } as const satisfies PassportState;

const disabledPseudo = { name: "disabled", mark: { kind: "pseudo", name: ":disabled" } } as const satisfies PassportState;
const hoverPseudo = { name: "hover", mark: { kind: "pseudo", name: ":hover" } } as const satisfies PassportState;
const focusVisiblePseudo = { name: "focus-visible", mark: { kind: "pseudo", name: ":focus-visible" } } as const satisfies PassportState;
const activePseudo = { name: "active", mark: { kind: "pseudo", name: ":active" } } as const satisfies PassportState;

const buttonPseudos: readonly PassportState[] = [hoverPseudo, focusVisiblePseudo, activePseudo];

const tableSectionStates: readonly PassportState[] = [...viewStates, disabledData];

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
    { name: "tableCell", states: [...viewStates, selected] },
    { name: "tableCellTrigger", states: tableCellTriggerStates },
    { name: "presetTrigger", states: buttonPseudos },
    { name: "valueText", states: [] },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  settings: defineSettings<DatePickerProps>()({}),
});
