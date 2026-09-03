export { DatePicker, type DatePickerProps } from "./root.js";
export { DatePickerLabel, type DatePickerLabelProps } from "./label.js";
export { DatePickerControl, type DatePickerControlProps } from "./control.js";
export { DatePickerInput, type DatePickerInputProps } from "./input.js";
export { DatePickerClearTrigger, type DatePickerClearTriggerProps } from "./clear-trigger.js";
export { DatePickerTrigger, type DatePickerTriggerProps } from "./trigger.js";
export { DatePickerContent, type DatePickerContentProps } from "./content.js";
export { DatePickerPositioner, type DatePickerPositionerProps } from "./positioner.js";
export { DatePickerView, type DatePickerViewProps } from "./view.js";
export { DatePickerViewControl, type DatePickerViewControlProps } from "./view-control.js";
export { DatePickerViewTrigger, type DatePickerViewTriggerProps } from "./view-trigger.js";
export { DatePickerRangeText, type DatePickerRangeTextProps } from "./range-text.js";
export { DatePickerPrevTrigger, type DatePickerPrevTriggerProps } from "./prev-trigger.js";
export { DatePickerNextTrigger, type DatePickerNextTriggerProps } from "./next-trigger.js";
export { DatePickerMonthSelect, type DatePickerMonthSelectProps } from "./month-select.js";
export { DatePickerYearSelect, type DatePickerYearSelectProps } from "./year-select.js";
export { DatePickerTable, type DatePickerTableProps } from "./table/index.js";
export { DatePickerTableHead, type DatePickerTableHeadProps } from "./table/head.js";
export { DatePickerTableHeader, type DatePickerTableHeaderProps } from "./table/header.js";
export { DatePickerTableBody, type DatePickerTableBodyProps } from "./table/body.js";
export { DatePickerTableRow, type DatePickerTableRowProps } from "./table/row.js";
export { DatePickerTableCell, type DatePickerTableCellProps } from "./table/cell.js";
export {
  DatePickerTableCellTrigger,
  type DatePickerTableCellTriggerProps,
} from "./table/cell-trigger.js";
export {
  DatePickerWeekNumberHeaderCell,
  type DatePickerWeekNumberHeaderCellProps,
} from "./table/week-number-header-cell.js";
export {
  DatePickerWeekNumberCell,
  type DatePickerWeekNumberCellProps,
} from "./table/week-number-cell.js";
export { DatePickerPresetTrigger, type DatePickerPresetTriggerProps } from "./preset-trigger.js";
export { DatePickerValueText, type DatePickerValueTextProps } from "./value-text.js";

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { DatePicker } from "./root.js";
import { DatePickerLabel } from "./label.js";
import { DatePickerControl } from "./control.js";
import { DatePickerInput } from "./input.js";
import { DatePickerClearTrigger } from "./clear-trigger.js";
import { DatePickerTrigger } from "./trigger.js";
import { DatePickerContent } from "./content.js";
import { DatePickerPositioner } from "./positioner.js";
import { DatePickerView } from "./view.js";
import { DatePickerViewControl } from "./view-control.js";
import { DatePickerViewTrigger } from "./view-trigger.js";
import { DatePickerRangeText } from "./range-text.js";
import { DatePickerPrevTrigger } from "./prev-trigger.js";
import { DatePickerNextTrigger } from "./next-trigger.js";
import { DatePickerMonthSelect } from "./month-select.js";
import { DatePickerYearSelect } from "./year-select.js";
import { DatePickerTable } from "./table/index.js";
import { DatePickerTableHead } from "./table/head.js";
import { DatePickerTableHeader } from "./table/header.js";
import { DatePickerTableBody } from "./table/body.js";
import { DatePickerTableRow } from "./table/row.js";
import { DatePickerTableCell } from "./table/cell.js";
import { DatePickerTableCellTrigger } from "./table/cell-trigger.js";
import { DatePickerPresetTrigger } from "./preset-trigger.js";
import { DatePickerValueText } from "./value-text.js";

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
