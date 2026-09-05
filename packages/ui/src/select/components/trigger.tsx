import {
  SelectTrigger as ArkTrigger,
  type SelectTriggerProps as ArkTriggerProps,
} from "@ark-ui/solid/select";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type SelectTriggerProps = ArkTriggerProps;

export function SelectTrigger(props: SelectTriggerProps) {
  traceLife("ui.select-trigger");

  return <ArkTrigger {...dropAddress(props)} />;
}
