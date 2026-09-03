import {
  PopoverRoot as ArkRoot,
  type PopoverRootProps as ArkRootProps,
} from "@ark-ui/solid/popover";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type PopoverProps = ArkRootProps;

export function Popover(props: PopoverProps) {
  traceLife("ui.popover");

  return <ArkRoot {...dropAddress(props)} />;
}
