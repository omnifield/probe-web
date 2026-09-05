import {
  ScrollAreaRoot as ArkRoot,
  type ScrollAreaRootProps as ArkRootProps,
} from "@ark-ui/solid/scroll-area";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type ScrollAreaProps = ArkRootProps;

export function ScrollArea(props: ScrollAreaProps) {
  traceLife("ui.scroll-area");

  return <ArkRoot {...dropAddress(props)} />;
}
