import {
  SegmentGroupItem as ArkItem,
  SegmentGroupItemHiddenInput as ArkItemHiddenInput,
  type SegmentGroupItemProps as ArkItemProps,
} from "@ark-ui/solid/segment-group";

import { splitProps } from "solid-js";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type SegmentGroupItemProps = ArkItemProps;

export function SegmentGroupItem(props: SegmentGroupItemProps) {
  traceLife("ui.segment-group-item");

  const [local, rest] = splitProps(props, ["children"]);

  return (
    <ArkItem {...dropAddress(rest)}>
      {local.children}
      <ArkItemHiddenInput />
    </ArkItem>
  );
}
