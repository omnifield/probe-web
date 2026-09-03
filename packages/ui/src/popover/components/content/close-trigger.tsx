import {
  PopoverCloseTrigger as ArkCloseTrigger,
  type PopoverCloseTriggerProps as ArkCloseTriggerProps,
} from "@ark-ui/solid/popover";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type PopoverCloseTriggerProps = ArkCloseTriggerProps;

export function PopoverCloseTrigger(props: PopoverCloseTriggerProps) {
  traceLife("ui.popover-close-trigger");

  return <ArkCloseTrigger {...dropAddress(props)} />;
}
