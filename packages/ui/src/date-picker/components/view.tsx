import {
  DatePickerView as ArkView,
  type DatePickerViewProps as ArkViewProps,
} from "@ark-ui/solid/date-picker";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type DatePickerViewProps = ArkViewProps;

export function DatePickerView(props: DatePickerViewProps) {
  traceLife("ui.date-picker-view");

  return <ArkView {...dropAddress(props)} />;
}
