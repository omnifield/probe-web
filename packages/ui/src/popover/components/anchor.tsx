import {
  PopoverAnchor as ArkAnchor,
  type PopoverAnchorProps as ArkAnchorProps,
} from "@ark-ui/solid/popover";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type PopoverAnchorProps = ArkAnchorProps;

export function PopoverAnchor(props: PopoverAnchorProps) {
  traceLife("ui.popover-anchor");

  return <ArkAnchor {...dropAddress(props)} />;
}
