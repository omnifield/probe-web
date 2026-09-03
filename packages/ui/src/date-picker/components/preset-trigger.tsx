import {
  DatePickerPresetTrigger as ArkPresetTrigger,
  type DatePickerPresetTriggerProps as ArkPresetTriggerProps,
} from "@ark-ui/solid/date-picker";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type DatePickerPresetTriggerProps = ArkPresetTriggerProps;

export function DatePickerPresetTrigger(props: DatePickerPresetTriggerProps) {
  traceLife("ui.date-picker-preset-trigger");

  return <ArkPresetTrigger {...dropAddress(props)} />;
}
