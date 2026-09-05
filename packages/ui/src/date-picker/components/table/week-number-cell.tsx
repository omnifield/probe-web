import {
  DatePickerWeekNumberCell as ArkWeekNumberCell,
  type DatePickerWeekNumberCellProps as ArkWeekNumberCellProps,
} from "@ark-ui/solid/date-picker";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type DatePickerWeekNumberCellProps = ArkWeekNumberCellProps;

export function DatePickerWeekNumberCell(props: DatePickerWeekNumberCellProps) {
  traceLife("ui.date-picker-week-number-cell");

  return <ArkWeekNumberCell {...dropAddress(props)} />;
}
