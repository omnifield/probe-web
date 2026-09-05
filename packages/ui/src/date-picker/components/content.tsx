import {
  DatePickerContent as ArkContent,
  type DatePickerContentProps as ArkContentProps,
} from "@ark-ui/solid/date-picker";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type DatePickerContentProps = ArkContentProps;

export function DatePickerContent(props: DatePickerContentProps) {
  traceLife("ui.date-picker-content");

  return <ArkContent {...dropAddress(props)} />;
}
