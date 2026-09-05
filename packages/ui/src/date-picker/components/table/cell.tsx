import {
  DatePickerTableCell as ArkTableCell,
  type DatePickerTableCellProps as ArkTableCellProps,
} from "@ark-ui/solid/date-picker";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type DatePickerTableCellProps = ArkTableCellProps;

export function DatePickerTableCell(props: DatePickerTableCellProps) {
  traceLife("ui.date-picker-table-cell");

  return <ArkTableCell {...dropAddress(props)} />;
}
