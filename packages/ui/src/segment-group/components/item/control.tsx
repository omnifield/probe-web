import {
  SegmentGroupItemControl as ArkItemControl,
  type SegmentGroupItemControlProps as ArkItemControlProps,
} from "@ark-ui/solid/segment-group";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type SegmentGroupItemControlProps = ArkItemControlProps;

export function SegmentGroupItemControl(props: SegmentGroupItemControlProps) {
  traceLife("ui.segment-group-item-control");

  return <ArkItemControl {...dropAddress(props)} />;
}
