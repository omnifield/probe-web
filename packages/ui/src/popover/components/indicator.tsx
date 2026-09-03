import {
  PopoverIndicator as ArkIndicator,
  type PopoverIndicatorProps as ArkIndicatorProps,
} from "@ark-ui/solid/popover";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type PopoverIndicatorProps = ArkIndicatorProps;

export function PopoverIndicator(props: PopoverIndicatorProps) {
  traceLife("ui.popover-indicator");

  return <ArkIndicator {...dropAddress(props)} />;
}
