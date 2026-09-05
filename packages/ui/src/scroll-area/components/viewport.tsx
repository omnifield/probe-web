import {
  ScrollAreaViewport as ArkViewport,
  type ScrollAreaViewportProps as ArkViewportProps,
} from "@ark-ui/solid/scroll-area";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type ScrollAreaViewportProps = ArkViewportProps;

export function ScrollAreaViewport(props: ScrollAreaViewportProps) {
  traceLife("ui.scroll-area-viewport");

  return <ArkViewport {...dropAddress(props)} />;
}
