import {
  DrawerPositioner as ArkPositioner,
  type DrawerPositionerProps as ArkPositionerProps,
} from "@ark-ui/solid/drawer";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type DrawerPositionerProps = ArkPositionerProps;

export function DrawerPositioner(props: DrawerPositionerProps) {
  traceLife("ui.drawer-positioner");

  return <ArkPositioner {...dropAddress(props)} />;
}
