import {
  DatePickerControl as ArkControl,
  type DatePickerControlProps as ArkControlProps,
} from "@ark-ui/solid/date-picker";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type DatePickerControlProps = ArkControlProps;

export function DatePickerControl(props: DatePickerControlProps) {
  traceLife("ui.date-picker-control");

  return <ArkControl {...dropAddress(props)} />;
}
