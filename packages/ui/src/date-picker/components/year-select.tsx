import {
  DatePickerYearSelect as ArkYearSelect,
  type DatePickerYearSelectProps as ArkYearSelectProps,
} from "@ark-ui/solid/date-picker";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type DatePickerYearSelectProps = ArkYearSelectProps;

export function DatePickerYearSelect(props: DatePickerYearSelectProps) {
  traceLife("ui.date-picker-year-select");

  return <ArkYearSelect {...dropAddress(props)} />;
}
