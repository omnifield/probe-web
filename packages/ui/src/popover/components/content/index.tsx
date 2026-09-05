import {
  PopoverContent as ArkContent,
  type PopoverContentProps as ArkContentProps,
} from "@ark-ui/solid/popover";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type PopoverContentProps = ArkContentProps;

export function PopoverContent(props: PopoverContentProps) {
  traceLife("ui.popover-content");

  return <ArkContent {...dropAddress(props)} />;
}
