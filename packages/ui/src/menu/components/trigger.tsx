import {
  MenuTrigger as ArkTrigger,
  type MenuTriggerProps as ArkTriggerProps,
} from "@ark-ui/solid/menu";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type MenuTriggerProps = ArkTriggerProps;

export function MenuTrigger(props: MenuTriggerProps) {
  traceLife("ui.menu-trigger");

  return <ArkTrigger {...dropAddress(props)} />;
}
