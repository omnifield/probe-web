import {
  DatePickerTableBody as ArkTableBody,
  type DatePickerTableBodyProps as ArkTableBodyProps,
} from "@ark-ui/solid/date-picker";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type DatePickerTableBodyProps = ArkTableBodyProps;

export function DatePickerTableBody(props: DatePickerTableBodyProps) {
  traceLife("ui.date-picker-table-body");

  return <ArkTableBody {...dropAddress(props)} />;
}
