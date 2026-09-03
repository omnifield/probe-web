import {
  MenuItem as ArkItem,
  type MenuItemProps as ArkItemProps,
} from "@ark-ui/solid/menu";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type MenuItemProps = ArkItemProps;

export function MenuItem(props: MenuItemProps) {
  traceLife("ui.menu-item");

  return <ArkItem {...dropAddress(props)} />;
}
