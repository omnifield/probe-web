import {
  DatePickerClearTrigger as ArkClearTrigger,
  DatePickerContent as ArkContent,
  DatePickerControl as ArkControl,
  DatePickerInput as ArkInput,
  DatePickerLabel as ArkLabel,
  DatePickerMonthSelect as ArkMonthSelect,
  DatePickerNextTrigger as ArkNextTrigger,
  DatePickerPositioner as ArkPositioner,
  DatePickerPresetTrigger as ArkPresetTrigger,
  DatePickerPrevTrigger as ArkPrevTrigger,
  DatePickerRangeText as ArkRangeText,
  DatePickerRoot as ArkRoot,
  DatePickerTable as ArkTable,
  DatePickerTableBody as ArkTableBody,
  DatePickerTableCell as ArkTableCell,
  DatePickerTableCellTrigger as ArkTableCellTrigger,
  DatePickerTableHead as ArkTableHead,
  DatePickerTableHeader as ArkTableHeader,
  DatePickerTableRow as ArkTableRow,
  DatePickerTrigger as ArkTrigger,
  DatePickerValueText as ArkValueText,
  DatePickerView as ArkView,
  DatePickerViewControl as ArkViewControl,
  DatePickerViewTrigger as ArkViewTrigger,
  DatePickerWeekNumberCell as ArkWeekNumberCell,
  DatePickerWeekNumberHeaderCell as ArkWeekNumberHeaderCell,
  DatePickerYearSelect as ArkYearSelect,
  type DatePickerClearTriggerProps as ArkClearTriggerProps,
  type DatePickerContentProps as ArkContentProps,
  type DatePickerControlProps as ArkControlProps,
  type DatePickerInputProps as ArkInputProps,
  type DatePickerLabelProps as ArkLabelProps,
  type DatePickerMonthSelectProps as ArkMonthSelectProps,
  type DatePickerNextTriggerProps as ArkNextTriggerProps,
  type DatePickerPositionerProps as ArkPositionerProps,
  type DatePickerPresetTriggerProps as ArkPresetTriggerProps,
  type DatePickerPrevTriggerProps as ArkPrevTriggerProps,
  type DatePickerRangeTextProps as ArkRangeTextProps,
  type DatePickerRootProps as ArkRootProps,
  type DatePickerTableBodyProps as ArkTableBodyProps,
  type DatePickerTableCellProps as ArkTableCellProps,
  type DatePickerTableCellTriggerProps as ArkTableCellTriggerProps,
  type DatePickerTableHeaderProps as ArkTableHeaderProps,
  type DatePickerTableHeadProps as ArkTableHeadProps,
  type DatePickerTableProps as ArkTableProps,
  type DatePickerTableRowProps as ArkTableRowProps,
  type DatePickerTriggerProps as ArkTriggerProps,
  type DatePickerValueTextProps as ArkValueTextProps,
  type DatePickerViewControlProps as ArkViewControlProps,
  type DatePickerViewProps as ArkViewProps,
  type DatePickerViewTriggerProps as ArkViewTriggerProps,
  type DatePickerWeekNumberCellProps as ArkWeekNumberCellProps,
  type DatePickerWeekNumberHeaderCellProps as ArkWeekNumberHeaderCellProps,
  type DatePickerYearSelectProps as ArkYearSelectProps,
} from "@ark-ui/solid/date-picker";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

// Date picker — the kit's biggest Ark-provided component, 25 parts
// (`ark-ui.com/docs/components/date-picker`).
//
// Same device as the rest of the Ark-provided kit: anatomy is Ark's (extended over zag's own,
// `../entity/anatomy.ts`), the address is set by Ark itself (spreads `parts.*.attrs` inside every
// `getXxxProps()`, `date-picker.connect.mjs`, or — for `valueText` alone — inside the Solid
// component directly, since that part has no connector method at all), wrappers are thin,
// `dropAddress` strips any address arriving from OUTSIDE so a node never lies about what it is
// (`PWEB-46`).
//
// `WeekNumberCell`/`WeekNumberHeaderCell` are real, separately-rendered nodes — they just carry
// `tableCell`'s own address, not one of their own (`../entity/anatomy.ts` explains why); wrapped
// here like every other part regardless, since the KIT map (`components/kit.ts`) still needs a
// component for `tableCell` and these are two of the three shapes that can draw it (the third
// being the plain `TableCell`, for day/month/year views).

/** Props of `DatePicker` — the root. */
export type DatePickerProps = ArkRootProps;

/**
 * The picker's root — holds the selected value(s), the open state, and the active view.
 *
 * @example
 * ```tsx
 * <DatePicker>
 *   <DatePickerLabel>Date</DatePickerLabel>
 *   <DatePickerControl>
 *     <DatePickerInput />
 *     <DatePickerTrigger>Open</DatePickerTrigger>
 *   </DatePickerControl>
 *   <DatePickerPositioner>
 *     <DatePickerContent>
 *       <DatePickerView view="day">
 *         <DatePickerViewControl>
 *           <DatePickerPrevTrigger>Prev</DatePickerPrevTrigger>
 *           <DatePickerViewTrigger>
 *             <DatePickerRangeText />
 *           </DatePickerViewTrigger>
 *           <DatePickerNextTrigger>Next</DatePickerNextTrigger>
 *         </DatePickerViewControl>
 *         <DatePickerTable>
 *           <DatePickerTableHead>
 *             <DatePickerTableRow>
 *               <DatePickerTableHeader>Mo</DatePickerTableHeader>
 *             </DatePickerTableRow>
 *           </DatePickerTableHead>
 *           <DatePickerTableBody>
 *             <DatePickerTableRow>
 *               <DatePickerTableCell value={someDate}>
 *                 <DatePickerTableCellTrigger>1</DatePickerTableCellTrigger>
 *               </DatePickerTableCell>
 *             </DatePickerTableRow>
 *           </DatePickerTableBody>
 *         </DatePickerTable>
 *       </DatePickerView>
 *     </DatePickerContent>
 *   </DatePickerPositioner>
 * </DatePicker>
 * ```
 */
export function DatePicker(props: DatePickerProps) {
  traceLife("ui.date-picker");

  return <ArkRoot {...dropAddress(props)} />;
}

/** Props of `DatePickerLabel`. */
export type DatePickerLabelProps = ArkLabelProps;

/** The picker's own label — ONE node, `<label>`. */
export function DatePickerLabel(props: DatePickerLabelProps) {
  traceLife("ui.date-picker-label");

  return <ArkLabel {...dropAddress(props)} />;
}

/** Props of `DatePickerControl`. */
export type DatePickerControlProps = ArkControlProps;

/** Wraps the input and trigger — ONE node, the row a consumer sees when closed. */
export function DatePickerControl(props: DatePickerControlProps) {
  traceLife("ui.date-picker-control");

  return <ArkControl {...dropAddress(props)} />;
}

/** Props of `DatePickerInput`. */
export type DatePickerInputProps = ArkInputProps;

/** The typed-date field — a real `<input>`, one per `index` in range/multiple mode. */
export function DatePickerInput(props: DatePickerInputProps) {
  traceLife("ui.date-picker-input");

  return <ArkInput {...dropAddress(props)} />;
}

/** Props of `DatePickerClearTrigger`. */
export type DatePickerClearTriggerProps = ArkClearTriggerProps;

/** Clears the selected value — a real `<button>`, hidden by the kit while nothing is selected. */
export function DatePickerClearTrigger(props: DatePickerClearTriggerProps) {
  traceLife("ui.date-picker-clear-trigger");

  return <ArkClearTrigger {...dropAddress(props)} />;
}

/** Props of `DatePickerTrigger`. */
export type DatePickerTriggerProps = ArkTriggerProps;

/** Opens/closes the calendar — a real `<button>`. */
export function DatePickerTrigger(props: DatePickerTriggerProps) {
  traceLife("ui.date-picker-trigger");

  return <ArkTrigger {...dropAddress(props)} />;
}

/** Props of `DatePickerContent`. */
export type DatePickerContentProps = ArkContentProps;

/** The floating panel — ONE node, holds every view. */
export function DatePickerContent(props: DatePickerContentProps) {
  traceLife("ui.date-picker-content");

  return <ArkContent {...dropAddress(props)} />;
}

/** Props of `DatePickerPositioner`. */
export type DatePickerPositionerProps = ArkPositionerProps;

/** Positions `content` against `control`/`trigger` — the same `@zag-js/popper` mechanism as the popover's. */
export function DatePickerPositioner(props: DatePickerPositionerProps) {
  traceLife("ui.date-picker-positioner");

  return <ArkPositioner {...dropAddress(props)} />;
}

/** Props of `DatePickerView`. */
export type DatePickerViewProps = ArkViewProps;

/** One view's panel (`view="day"|"month"|"year"`) — hidden by the kit while a different one is active. */
export function DatePickerView(props: DatePickerViewProps) {
  traceLife("ui.date-picker-view");

  return <ArkView {...dropAddress(props)} />;
}

/** Props of `DatePickerViewControl`. */
export type DatePickerViewControlProps = ArkViewControlProps;

/** Wraps a view's own prev/next/toggle row — ONE node per view. */
export function DatePickerViewControl(props: DatePickerViewControlProps) {
  traceLife("ui.date-picker-view-control");

  return <ArkViewControl {...dropAddress(props)} />;
}

/** Props of `DatePickerViewTrigger`. */
export type DatePickerViewTriggerProps = ArkViewTriggerProps;

/** Switches to the next-broader view (day → month → year) — a real `<button>`. */
export function DatePickerViewTrigger(props: DatePickerViewTriggerProps) {
  traceLife("ui.date-picker-view-trigger");

  return <ArkViewTrigger {...dropAddress(props)} />;
}

/** Props of `DatePickerRangeText`. */
export type DatePickerRangeTextProps = ArkRangeTextProps;

/** The visible range's own label (e.g. a month name) — ONE node, text set by the kit. */
export function DatePickerRangeText(props: DatePickerRangeTextProps) {
  traceLife("ui.date-picker-range-text");

  return <ArkRangeText {...dropAddress(props)} />;
}

/** Props of `DatePickerPrevTrigger`. */
export type DatePickerPrevTriggerProps = ArkPrevTriggerProps;

/** Steps the visible range backward — a real `<button>`. */
export function DatePickerPrevTrigger(props: DatePickerPrevTriggerProps) {
  traceLife("ui.date-picker-prev-trigger");

  return <ArkPrevTrigger {...dropAddress(props)} />;
}

/** Props of `DatePickerNextTrigger`. */
export type DatePickerNextTriggerProps = ArkNextTriggerProps;

/** Steps the visible range forward — a real `<button>`. */
export function DatePickerNextTrigger(props: DatePickerNextTriggerProps) {
  traceLife("ui.date-picker-next-trigger");

  return <ArkNextTrigger {...dropAddress(props)} />;
}

/** Props of `DatePickerMonthSelect`. */
export type DatePickerMonthSelectProps = ArkMonthSelectProps;

/** Jumps the focused month directly — a real `<select>`. */
export function DatePickerMonthSelect(props: DatePickerMonthSelectProps) {
  traceLife("ui.date-picker-month-select");

  return <ArkMonthSelect {...dropAddress(props)} />;
}

/** Props of `DatePickerYearSelect`. */
export type DatePickerYearSelectProps = ArkYearSelectProps;

/** Jumps the focused year directly — a real `<select>`. */
export function DatePickerYearSelect(props: DatePickerYearSelectProps) {
  traceLife("ui.date-picker-year-select");

  return <ArkYearSelect {...dropAddress(props)} />;
}

/** Props of `DatePickerTable`. */
export type DatePickerTableProps = ArkTableProps;

/** The calendar grid — a real `<table role="grid">`, one per view. */
export function DatePickerTable(props: DatePickerTableProps) {
  traceLife("ui.date-picker-table");

  return <ArkTable {...dropAddress(props)} />;
}

/** Props of `DatePickerTableHead`. */
export type DatePickerTableHeadProps = ArkTableHeadProps;

/** Wraps the weekday header row — ONE node, `<thead>`. */
export function DatePickerTableHead(props: DatePickerTableHeadProps) {
  traceLife("ui.date-picker-table-head");

  return <ArkTableHead {...dropAddress(props)} />;
}

/** Props of `DatePickerTableHeader`. */
export type DatePickerTableHeaderProps = ArkTableHeaderProps;

/** One weekday's own header cell — `<th>`. */
export function DatePickerTableHeader(props: DatePickerTableHeaderProps) {
  traceLife("ui.date-picker-table-header");

  return <ArkTableHeader {...dropAddress(props)} />;
}

/** Props of `DatePickerTableBody`. */
export type DatePickerTableBodyProps = ArkTableBodyProps;

/** Wraps the calendar's rows — ONE node, `<tbody>`. */
export function DatePickerTableBody(props: DatePickerTableBodyProps) {
  traceLife("ui.date-picker-table-body");

  return <ArkTableBody {...dropAddress(props)} />;
}

/** Props of `DatePickerTableRow`. */
export type DatePickerTableRowProps = ArkTableRowProps;

/** One week (day view) or one row of months/years (other views) — `<tr>`. */
export function DatePickerTableRow(props: DatePickerTableRowProps) {
  traceLife("ui.date-picker-table-row");

  return <ArkTableRow {...dropAddress(props)} />;
}

/** Props of `DatePickerTableCell`. */
export type DatePickerTableCellProps = ArkTableCellProps;

/** One grid cell — `<td>`; `value` (a date, a month number, or a year number) is required. */
export function DatePickerTableCell(props: DatePickerTableCellProps) {
  traceLife("ui.date-picker-table-cell");

  return <ArkTableCell {...dropAddress(props)} />;
}

/** Props of `DatePickerTableCellTrigger`. */
export type DatePickerTableCellTriggerProps = ArkTableCellTriggerProps;

/** The clickable surface INSIDE a cell — role `button`, real keyboard/pointer handling. */
export function DatePickerTableCellTrigger(
  props: DatePickerTableCellTriggerProps,
) {
  traceLife("ui.date-picker-table-cell-trigger");

  return <ArkTableCellTrigger {...dropAddress(props)} />;
}

/** Props of `DatePickerWeekNumberHeaderCell`. */
export type DatePickerWeekNumberHeaderCellProps = ArkWeekNumberHeaderCellProps;

/**
 * The header cell above the week-number column — `<th>`. Carries `tableCell`'s own address, not
 * one of its own (`../entity/anatomy.ts`); only rendered when `showWeekNumbers` is set.
 */
export function DatePickerWeekNumberHeaderCell(
  props: DatePickerWeekNumberHeaderCellProps,
) {
  traceLife("ui.date-picker-week-number-header-cell");

  return <ArkWeekNumberHeaderCell {...dropAddress(props)} />;
}

/** Props of `DatePickerWeekNumberCell`. */
export type DatePickerWeekNumberCellProps = ArkWeekNumberCellProps;

/** One row's own week-number cell — `<td>`; same address note as `DatePickerWeekNumberHeaderCell`. */
export function DatePickerWeekNumberCell(props: DatePickerWeekNumberCellProps) {
  traceLife("ui.date-picker-week-number-cell");

  return <ArkWeekNumberCell {...dropAddress(props)} />;
}

/** Props of `DatePickerPresetTrigger`. */
export type DatePickerPresetTriggerProps = ArkPresetTriggerProps;

/** Jumps straight to a named range (e.g. "last 7 days") — a real `<button>`; `value` is required. */
export function DatePickerPresetTrigger(props: DatePickerPresetTriggerProps) {
  traceLife("ui.date-picker-preset-trigger");

  return <ArkPresetTrigger {...dropAddress(props)} />;
}

/** Props of `DatePickerValueText`. */
export type DatePickerValueTextProps = ArkValueTextProps;

/**
 * Shows the selected value(s) as text — ONE node, `<span>`, formatted by the kit
 * (`placeholder`/`separator` are the only props; a function `children` switches to a per-value
 * render callback instead of the built-in join — Ark's own, not reimplemented here).
 */
export function DatePickerValueText(props: DatePickerValueTextProps) {
  traceLife("ui.date-picker-value-text");

  return <ArkValueText {...dropAddress(props)} />;
}

// MAP of the date picker: passport part → the component that draws it (`PWEB-84`).
//
// `tableCell` is drawn by the plain `DatePickerTableCell` — `WeekNumberCell`/
// `WeekNumberHeaderCell` are separate, real components that happen to share its address
// (`../entity/anatomy.ts`), not alternate ways to draw the SAME map entry, so neither is listed
// here: the map's job is "one component per PART", and week numbers are not a part of their own.

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";

/** The date picker's passport together with whatever draws each of its 25 parts. */
export const kit = defineKitComponent(passport, {
  root: DatePicker,
  label: DatePickerLabel,
  control: DatePickerControl,
  input: DatePickerInput,
  clearTrigger: DatePickerClearTrigger,
  trigger: DatePickerTrigger,
  content: DatePickerContent,
  positioner: DatePickerPositioner,
  view: DatePickerView,
  viewControl: DatePickerViewControl,
  viewTrigger: DatePickerViewTrigger,
  rangeText: DatePickerRangeText,
  prevTrigger: DatePickerPrevTrigger,
  nextTrigger: DatePickerNextTrigger,
  monthSelect: DatePickerMonthSelect,
  yearSelect: DatePickerYearSelect,
  table: DatePickerTable,
  tableHead: DatePickerTableHead,
  tableHeader: DatePickerTableHeader,
  tableBody: DatePickerTableBody,
  tableRow: DatePickerTableRow,
  tableCell: DatePickerTableCell,
  tableCellTrigger: DatePickerTableCellTrigger,
  presetTrigger: DatePickerPresetTrigger,
  valueText: DatePickerValueText,
});
