import {
  DatePickerClearTrigger as ArkClearTrigger,
  type DatePickerClearTriggerProps as ArkClearTriggerProps,
} from "@ark-ui/solid/date-picker";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type DatePickerClearTriggerProps = ArkClearTriggerProps;

export function DatePickerClearTrigger(props: DatePickerClearTriggerProps) {
  traceLife("ui.date-picker-clear-trigger");

  return <ArkClearTrigger {...dropAddress(props)} />;
}
