import {
  DatePickerViewTrigger as ArkViewTrigger,
  type DatePickerViewTriggerProps as ArkViewTriggerProps,
} from "@ark-ui/solid/date-picker";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type DatePickerViewTriggerProps = ArkViewTriggerProps;

export function DatePickerViewTrigger(props: DatePickerViewTriggerProps) {
  traceLife("ui.date-picker-view-trigger");

  return <ArkViewTrigger {...dropAddress(props)} />;
}
