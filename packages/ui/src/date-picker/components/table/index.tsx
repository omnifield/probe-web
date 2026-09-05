import {
  DatePickerTable as ArkTable,
  type DatePickerTableProps as ArkTableProps,
} from "@ark-ui/solid/date-picker";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type DatePickerTableProps = ArkTableProps;

export function DatePickerTable(props: DatePickerTableProps) {
  traceLife("ui.date-picker-table");

  return <ArkTable {...dropAddress(props)} />;
}
