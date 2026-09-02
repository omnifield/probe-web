import {
  DrawerTrigger as ArkTrigger,
  type DrawerTriggerProps as ArkTriggerProps,
} from "@ark-ui/solid/drawer";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type DrawerTriggerProps = ArkTriggerProps;

export function DrawerTrigger(props: DrawerTriggerProps) {
  traceLife("ui.drawer-trigger");

  return <ArkTrigger {...dropAddress(props)} />;
}
