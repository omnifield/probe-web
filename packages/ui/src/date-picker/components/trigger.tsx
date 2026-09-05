import {
  DatePickerTrigger as ArkTrigger,
  type DatePickerTriggerProps as ArkTriggerProps,
} from "@ark-ui/solid/date-picker";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type DatePickerTriggerProps = ArkTriggerProps;

export function DatePickerTrigger(props: DatePickerTriggerProps) {
  traceLife("ui.date-picker-trigger");

  return <ArkTrigger {...dropAddress(props)} />;
}
