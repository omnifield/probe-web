import {
  DatePickerWeekNumberHeaderCell as ArkWeekNumberHeaderCell,
  type DatePickerWeekNumberHeaderCellProps as ArkWeekNumberHeaderCellProps,
} from "@ark-ui/solid/date-picker";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type DatePickerWeekNumberHeaderCellProps = ArkWeekNumberHeaderCellProps;

export function DatePickerWeekNumberHeaderCell(props: DatePickerWeekNumberHeaderCellProps) {
  traceLife("ui.date-picker-week-number-header-cell");

  return <ArkWeekNumberHeaderCell {...dropAddress(props)} />;
}
