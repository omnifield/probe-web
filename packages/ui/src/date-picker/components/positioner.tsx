import {
  DatePickerPositioner as ArkPositioner,
  type DatePickerPositionerProps as ArkPositionerProps,
} from "@ark-ui/solid/date-picker";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type DatePickerPositionerProps = ArkPositionerProps;

export function DatePickerPositioner(props: DatePickerPositionerProps) {
  traceLife("ui.date-picker-positioner");

  return <ArkPositioner {...dropAddress(props)} />;
}
