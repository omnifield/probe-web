import {
  ScrollAreaScrollbar as ArkScrollbar,
  type ScrollAreaScrollbarProps as ArkScrollbarProps,
} from "@ark-ui/solid/scroll-area";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type ScrollAreaScrollbarProps = ArkScrollbarProps;

export function ScrollAreaScrollbar(props: ScrollAreaScrollbarProps) {
  traceLife("ui.scroll-area-scrollbar");

  return <ArkScrollbar {...dropAddress(props)} />;
}
