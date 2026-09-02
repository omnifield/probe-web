import {
  DrawerSwipeArea as ArkSwipeArea,
  type DrawerSwipeAreaProps as ArkSwipeAreaProps,
} from "@ark-ui/solid/drawer";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type DrawerSwipeAreaProps = ArkSwipeAreaProps;

export function DrawerSwipeArea(props: DrawerSwipeAreaProps) {
  traceLife("ui.drawer-swipe-area");

  return <ArkSwipeArea {...dropAddress(props)} />;
}
