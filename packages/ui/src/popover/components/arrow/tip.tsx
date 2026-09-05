import {
  PopoverArrowTip as ArkArrowTip,
  type PopoverArrowTipProps as ArkArrowTipProps,
} from "@ark-ui/solid/popover";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type PopoverArrowTipProps = ArkArrowTipProps;

export function PopoverArrowTip(props: PopoverArrowTipProps) {
  traceLife("ui.popover-arrow-tip");

  return <ArkArrowTip {...dropAddress(props)} />;
}
