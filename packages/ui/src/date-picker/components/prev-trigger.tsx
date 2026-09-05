import {
  DatePickerPrevTrigger as ArkPrevTrigger,
  type DatePickerPrevTriggerProps as ArkPrevTriggerProps,
} from "@ark-ui/solid/date-picker";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type DatePickerPrevTriggerProps = ArkPrevTriggerProps;

export function DatePickerPrevTrigger(props: DatePickerPrevTriggerProps) {
  traceLife("ui.date-picker-prev-trigger");

  return <ArkPrevTrigger {...dropAddress(props)} />;
}
