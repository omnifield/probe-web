import {
  PopoverIndicator as ArkIndicator,
  type PopoverIndicatorProps as ArkIndicatorProps,
} from "@ark-ui/solid/popover";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";
import { anatomyParts } from "../entity/anatomy.js";

export type PopoverControlIndicatorProps = ArkIndicatorProps;

export function PopoverControlIndicator(props: PopoverControlIndicatorProps) {
  traceLife("ui.popover-control-indicator");

  return (
    <ArkIndicator
      {...dropAddress(props)}
      {...anatomyParts.controlIndicator.attrs}
    />
  );
}
