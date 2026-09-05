import {
  PopoverPositioner as ArkPositioner,
  type PopoverPositionerProps as ArkPositionerProps,
} from "@ark-ui/solid/popover";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type PopoverPositionerProps = ArkPositionerProps;

export function PopoverPositioner(props: PopoverPositionerProps) {
  traceLife("ui.popover-positioner");

  return <ArkPositioner {...dropAddress(props)} />;
}
