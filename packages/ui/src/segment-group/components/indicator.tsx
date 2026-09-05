import {
  SegmentGroupIndicator as ArkIndicator,
  type SegmentGroupIndicatorProps as ArkIndicatorProps,
} from "@ark-ui/solid/segment-group";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type SegmentGroupIndicatorProps = ArkIndicatorProps;

export function SegmentGroupIndicator(props: SegmentGroupIndicatorProps) {
  traceLife("ui.segment-group-indicator");

  return <ArkIndicator {...dropAddress(props)} />;
}
