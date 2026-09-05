import {
  DatePickerTableHeader as ArkTableHeader,
  type DatePickerTableHeaderProps as ArkTableHeaderProps,
} from "@ark-ui/solid/date-picker";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type DatePickerTableHeaderProps = ArkTableHeaderProps;

export function DatePickerTableHeader(props: DatePickerTableHeaderProps) {
  traceLife("ui.date-picker-table-header");

  return <ArkTableHeader {...dropAddress(props)} />;
}
