import {
  MenuItemGroup as ArkItemGroup,
  type MenuItemGroupProps as ArkItemGroupProps,
} from "@ark-ui/solid/menu";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type MenuItemGroupProps = ArkItemGroupProps;

export function MenuItemGroup(props: MenuItemGroupProps) {
  traceLife("ui.menu-item-group");

  return <ArkItemGroup {...dropAddress(props)} />;
}
