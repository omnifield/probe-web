import {
  SegmentGroupRoot as ArkRoot,
  type SegmentGroupRootProps as ArkRootProps,
} from "@ark-ui/solid/segment-group";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type SegmentGroupProps = ArkRootProps;

export function SegmentGroup(props: SegmentGroupProps) {
  traceLife("ui.segment-group");

  return <ArkRoot {...dropAddress(props)} />;
}
