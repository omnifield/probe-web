import {
  MenuItemGroupLabel as ArkItemGroupLabel,
  type MenuItemGroupLabelProps as ArkItemGroupLabelProps,
} from "@ark-ui/solid/menu";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type MenuItemGroupLabelProps = ArkItemGroupLabelProps;

export function MenuItemGroupLabel(props: MenuItemGroupLabelProps) {
  traceLife("ui.menu-item-group-label");

  return <ArkItemGroupLabel {...dropAddress(props)} />;
}
