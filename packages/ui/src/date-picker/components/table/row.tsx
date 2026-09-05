import {
  DatePickerTableRow as ArkTableRow,
  type DatePickerTableRowProps as ArkTableRowProps,
} from "@ark-ui/solid/date-picker";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type DatePickerTableRowProps = ArkTableRowProps;

export function DatePickerTableRow(props: DatePickerTableRowProps) {
  traceLife("ui.date-picker-table-row");

  return <ArkTableRow {...dropAddress(props)} />;
}
