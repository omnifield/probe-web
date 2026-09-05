import {
  ScrollAreaCorner as ArkCorner,
  type ScrollAreaCornerProps as ArkCornerProps,
} from "@ark-ui/solid/scroll-area";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type ScrollAreaCornerProps = ArkCornerProps;

export function ScrollAreaCorner(props: ScrollAreaCornerProps) {
  traceLife("ui.scroll-area-corner");

  return <ArkCorner {...dropAddress(props)} />;
}
