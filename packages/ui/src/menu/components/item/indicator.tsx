import {
  MenuItemIndicator as ArkItemIndicator,
  type MenuItemIndicatorProps as ArkItemIndicatorProps,
} from "@ark-ui/solid/menu";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type MenuItemIndicatorProps = ArkItemIndicatorProps;

export function MenuItemIndicator(props: MenuItemIndicatorProps) {
  traceLife("ui.menu-item-indicator");

  return <ArkItemIndicator {...dropAddress(props)} />;
}
