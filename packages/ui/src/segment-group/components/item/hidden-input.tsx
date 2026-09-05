import {
  SegmentGroupItemHiddenInput as ArkItemHiddenInput,
  type SegmentGroupItemHiddenInputProps as ArkItemHiddenInputProps,
} from "@ark-ui/solid/segment-group";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type SegmentGroupItemHiddenInputProps = ArkItemHiddenInputProps;

export function SegmentGroupItemHiddenInput(props: SegmentGroupItemHiddenInputProps) {
  traceLife("ui.segment-group-item-hidden-input");

  return <ArkItemHiddenInput {...dropAddress(props)} />;
}
