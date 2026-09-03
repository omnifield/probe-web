import {
  ScrollAreaThumb as ArkThumb,
  type ScrollAreaThumbProps as ArkThumbProps,
} from "@ark-ui/solid/scroll-area";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type ScrollAreaThumbProps = ArkThumbProps;

export function ScrollAreaThumb(props: ScrollAreaThumbProps) {
  traceLife("ui.scroll-area-thumb");

  return <ArkThumb {...dropAddress(props)} />;
}
