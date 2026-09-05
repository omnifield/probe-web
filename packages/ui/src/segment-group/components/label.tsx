import {
  SegmentGroupLabel as ArkLabel,
  type SegmentGroupLabelProps as ArkLabelProps,
} from "@ark-ui/solid/segment-group";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type SegmentGroupLabelProps = ArkLabelProps;

export function SegmentGroupLabel(props: SegmentGroupLabelProps) {
  traceLife("ui.segment-group-label");

  return <ArkLabel {...dropAddress(props)} />;
}
