import {
  DatePickerTableHead as ArkTableHead,
  type DatePickerTableHeadProps as ArkTableHeadProps,
} from "@ark-ui/solid/date-picker";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type DatePickerTableHeadProps = ArkTableHeadProps;

export function DatePickerTableHead(props: DatePickerTableHeadProps) {
  traceLife("ui.date-picker-table-head");

  return <ArkTableHead {...dropAddress(props)} />;
}
