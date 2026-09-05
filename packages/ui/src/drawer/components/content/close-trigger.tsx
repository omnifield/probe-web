import {
  DrawerCloseTrigger as ArkCloseTrigger,
  type DrawerCloseTriggerProps as ArkCloseTriggerProps,
} from "@ark-ui/solid/drawer";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type DrawerCloseTriggerProps = ArkCloseTriggerProps;

export function DrawerCloseTrigger(props: DrawerCloseTriggerProps) {
  traceLife("ui.drawer-close-trigger");

  return <ArkCloseTrigger {...dropAddress(props)} />;
}
