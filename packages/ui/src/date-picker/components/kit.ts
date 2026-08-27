// MAP of the date picker: passport part → the component that draws it (`PWEB-84`).
//
// `tableCell` is drawn by the plain `DatePickerTableCell` — `WeekNumberCell`/
// `WeekNumberHeaderCell` are separate, real components that happen to share its address
// (`../entity/anatomy.ts`), not alternate ways to draw the SAME map entry, so neither is listed
// here: the map's job is "one component per PART", and week numbers are not a part of their own.

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import {
  DatePicker,
  DatePickerClearTrigger,
  DatePickerContent,
  DatePickerControl,
  DatePickerInput,
  DatePickerLabel,
  DatePickerMonthSelect,
  DatePickerNextTrigger,
  DatePickerPositioner,
  DatePickerPresetTrigger,
  DatePickerPrevTrigger,
  DatePickerRangeText,
  DatePickerTable,
  DatePickerTableBody,
  DatePickerTableCell,
  DatePickerTableCellTrigger,
  DatePickerTableHead,
  DatePickerTableHeader,
  DatePickerTableRow,
  DatePickerTrigger,
  DatePickerValueText,
  DatePickerView,
  DatePickerViewControl,
  DatePickerViewTrigger,
  DatePickerYearSelect,
} from "./index.jsx";

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
