import {
  SegmentGroupRoot as ArkRoot,
  type SegmentGroupRootProps as ArkRootProps,
} from "@ark-ui/solid/segment-group";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { useKitLife } from "../../shared/utils/skin-life.js";
import { passport } from "../entity/passport.js";

export type SegmentGroupProps = ArkRootProps;

export function SegmentGroup(props: SegmentGroupProps) {
  useKitLife(passport, props);

  return <ArkRoot {...dropAddress(props)} />;
}
