import {
  DatePickerRoot as ArkRoot,
  type DatePickerRootProps as ArkRootProps,
} from "@ark-ui/solid/date-picker";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type DatePickerProps = ArkRootProps;

export function DatePicker(props: DatePickerProps) {
  traceLife("ui.date-picker");

  return <ArkRoot {...dropAddress(props)} />;
}
