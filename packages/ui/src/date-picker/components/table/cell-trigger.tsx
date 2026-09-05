import {
  DatePickerTableCellTrigger as ArkTableCellTrigger,
  type DatePickerTableCellTriggerProps as ArkTableCellTriggerProps,
} from "@ark-ui/solid/date-picker";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type DatePickerTableCellTriggerProps = ArkTableCellTriggerProps;

export function DatePickerTableCellTrigger(props: DatePickerTableCellTriggerProps) {
  traceLife("ui.date-picker-table-cell-trigger");

  return <ArkTableCellTrigger {...dropAddress(props)} />;
}
