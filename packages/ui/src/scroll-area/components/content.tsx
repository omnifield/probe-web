import {
  ScrollAreaContent as ArkContent,
  type ScrollAreaContentProps as ArkContentProps,
} from "@ark-ui/solid/scroll-area";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type ScrollAreaContentProps = ArkContentProps;

export function ScrollAreaContent(props: ScrollAreaContentProps) {
  traceLife("ui.scroll-area-content");

  return <ArkContent {...dropAddress(props)} />;
}
