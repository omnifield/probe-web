import {
  DatePickerValueText as ArkValueText,
  type DatePickerValueTextProps as ArkValueTextProps,
} from "@ark-ui/solid/date-picker";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type DatePickerValueTextProps = ArkValueTextProps;

export function DatePickerValueText(props: DatePickerValueTextProps) {
  traceLife("ui.date-picker-value-text");

  return <ArkValueText {...dropAddress(props)} />;
}
