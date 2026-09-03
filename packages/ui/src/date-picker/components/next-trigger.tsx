import {
  DatePickerNextTrigger as ArkNextTrigger,
  type DatePickerNextTriggerProps as ArkNextTriggerProps,
} from "@ark-ui/solid/date-picker";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type DatePickerNextTriggerProps = ArkNextTriggerProps;

export function DatePickerNextTrigger(props: DatePickerNextTriggerProps) {
  traceLife("ui.date-picker-next-trigger");

  return <ArkNextTrigger {...dropAddress(props)} />;
}
