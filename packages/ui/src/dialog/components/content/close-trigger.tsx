import {
  DialogCloseTrigger as ArkCloseTrigger,
  type DialogCloseTriggerProps as ArkCloseTriggerProps,
} from "@ark-ui/solid/dialog";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type DialogCloseTriggerProps = ArkCloseTriggerProps;

export function DialogCloseTrigger(props: DialogCloseTriggerProps) {
  traceLife("ui.dialog-close-trigger");

  return <ArkCloseTrigger {...dropAddress(props)} />;
}
