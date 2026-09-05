import {
  DatePickerRangeText as ArkRangeText,
  type DatePickerRangeTextProps as ArkRangeTextProps,
} from "@ark-ui/solid/date-picker";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type DatePickerRangeTextProps = ArkRangeTextProps;

export function DatePickerRangeText(props: DatePickerRangeTextProps) {
  traceLife("ui.date-picker-range-text");

  return <ArkRangeText {...dropAddress(props)} />;
}
