import {
  MenuItemText as ArkItemText,
  type MenuItemTextProps as ArkItemTextProps,
} from "@ark-ui/solid/menu";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type MenuItemTextProps = ArkItemTextProps;

export function MenuItemText(props: MenuItemTextProps) {
  traceLife("ui.menu-item-text");

  return <ArkItemText {...dropAddress(props)} />;
}
