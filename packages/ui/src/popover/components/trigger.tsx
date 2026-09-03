import {
  PopoverTrigger as ArkTrigger,
  type PopoverTriggerProps as ArkTriggerProps,
} from "@ark-ui/solid/popover";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type PopoverTriggerProps = ArkTriggerProps;

export function PopoverTrigger(props: PopoverTriggerProps) {
  traceLife("ui.popover-trigger");

  return <ArkTrigger {...dropAddress(props)} />;
}
