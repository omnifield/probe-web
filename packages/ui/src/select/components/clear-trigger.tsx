import {
  SelectClearTrigger as ArkClearTrigger,
  type SelectClearTriggerProps as ArkClearTriggerProps,
} from "@ark-ui/solid/select";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type SelectClearTriggerProps = ArkClearTriggerProps;

export function SelectClearTrigger(props: SelectClearTriggerProps) {
  traceLife("ui.select-clear-trigger");

  return <ArkClearTrigger {...dropAddress(props)} />;
}
