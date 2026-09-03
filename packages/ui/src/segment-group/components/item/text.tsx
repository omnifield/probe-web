import {
  SegmentGroupItemText as ArkItemText,
  type SegmentGroupItemTextProps as ArkItemTextProps,
} from "@ark-ui/solid/segment-group";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type SegmentGroupItemTextProps = ArkItemTextProps;

export function SegmentGroupItemText(props: SegmentGroupItemTextProps) {
  traceLife("ui.segment-group-item-text");

  return <ArkItemText {...dropAddress(props)} />;
}
