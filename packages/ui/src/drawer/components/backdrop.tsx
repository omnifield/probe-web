import {
  DrawerBackdrop as ArkBackdrop,
  type DrawerBackdropProps as ArkBackdropProps,
} from "@ark-ui/solid/drawer";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type DrawerBackdropProps = ArkBackdropProps;

export function DrawerBackdrop(props: DrawerBackdropProps) {
  traceLife("ui.drawer-backdrop");

  return <ArkBackdrop {...dropAddress(props)} />;
}
