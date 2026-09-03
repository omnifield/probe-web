import {
  PopoverTrigger as ArkTrigger,
  type PopoverTriggerProps as ArkTriggerProps,
} from "@ark-ui/solid/popover";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";
import { anatomyParts } from "../entity/anatomy.js";

export type PopoverControlProps = ArkTriggerProps;

export function PopoverControl(props: PopoverControlProps) {
  traceLife("ui.popover-control");

  return <ArkTrigger {...dropAddress(props)} {...anatomyParts.control.attrs} />;
}
