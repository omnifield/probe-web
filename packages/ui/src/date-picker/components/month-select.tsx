import {
  DatePickerMonthSelect as ArkMonthSelect,
  type DatePickerMonthSelectProps as ArkMonthSelectProps,
} from "@ark-ui/solid/date-picker";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type DatePickerMonthSelectProps = ArkMonthSelectProps;

export function DatePickerMonthSelect(props: DatePickerMonthSelectProps) {
  traceLife("ui.date-picker-month-select");

  return <ArkMonthSelect {...dropAddress(props)} />;
}
