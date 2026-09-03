import {
  DatePickerInput as ArkInput,
  type DatePickerInputProps as ArkInputProps,
} from "@ark-ui/solid/date-picker";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type DatePickerInputProps = ArkInputProps;

export function DatePickerInput(props: DatePickerInputProps) {
  traceLife("ui.date-picker-input");

  return <ArkInput {...dropAddress(props)} />;
}
