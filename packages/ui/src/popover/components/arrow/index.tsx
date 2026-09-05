import {
  PopoverArrow as ArkArrow,
  type PopoverArrowProps as ArkArrowProps,
} from "@ark-ui/solid/popover";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type PopoverArrowProps = ArkArrowProps;

export function PopoverArrow(props: PopoverArrowProps) {
  traceLife("ui.popover-arrow");

  return <ArkArrow {...dropAddress(props)} />;
}
