import {
  MenuTriggerItem as ArkTriggerItem,
  type MenuTriggerItemProps as ArkTriggerItemProps,
} from "@ark-ui/solid/menu";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type MenuTriggerItemProps = ArkTriggerItemProps;

export function MenuTriggerItem(props: MenuTriggerItemProps) {
  traceLife("ui.menu-trigger-item");

  return <ArkTriggerItem {...dropAddress(props)} />;
}
