import {
  DatePickerViewControl as ArkViewControl,
  type DatePickerViewControlProps as ArkViewControlProps,
} from "@ark-ui/solid/date-picker";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type DatePickerViewControlProps = ArkViewControlProps;

export function DatePickerViewControl(props: DatePickerViewControlProps) {
  traceLife("ui.date-picker-view-control");

  return <ArkViewControl {...dropAddress(props)} />;
}
