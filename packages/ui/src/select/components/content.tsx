import {
  SelectContent as ArkContent,
  type SelectContentProps as ArkContentProps,
} from "@ark-ui/solid/select";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type SelectContentProps = ArkContentProps;

export function SelectContent(props: SelectContentProps) {
  traceLife("ui.select-content");

  return <ArkContent {...dropAddress(props)} />;
}
