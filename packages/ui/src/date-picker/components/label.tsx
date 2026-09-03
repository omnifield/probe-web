import {
  DatePickerLabel as ArkLabel,
  type DatePickerLabelProps as ArkLabelProps,
} from "@ark-ui/solid/date-picker";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type DatePickerLabelProps = ArkLabelProps;

export function DatePickerLabel(props: DatePickerLabelProps) {
  traceLife("ui.date-picker-label");

  return <ArkLabel {...dropAddress(props)} />;
}
