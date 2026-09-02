import {
  DrawerRoot as ArkRoot,
  type DrawerRootProps as ArkRootProps,
} from "@ark-ui/solid/drawer";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type DrawerProps = ArkRootProps;

export function Drawer(props: DrawerProps) {
  traceLife("ui.drawer");

  return <ArkRoot {...dropAddress(props)} />;
}
