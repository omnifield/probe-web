import {
  DialogTrigger as ArkTrigger,
  type DialogTriggerProps as ArkTriggerProps,
} from "@ark-ui/solid/dialog";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type DialogTriggerProps = ArkTriggerProps;

export function DialogTrigger(props: DialogTriggerProps) {
  traceLife("ui.dialog-trigger");

  return <ArkTrigger {...dropAddress(props)} />;
}
