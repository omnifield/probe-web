import {
  MenuContextTrigger as ArkContextTrigger,
  type MenuContextTriggerProps as ArkContextTriggerProps,
} from "@ark-ui/solid/menu";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type MenuContextTriggerProps = ArkContextTriggerProps;

export function MenuContextTrigger(props: MenuContextTriggerProps) {
  traceLife("ui.menu-context-trigger");

  return <ArkContextTrigger {...dropAddress(props)} />;
}
