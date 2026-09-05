import {
  DrawerTitle as ArkTitle,
  type DrawerTitleProps as ArkTitleProps,
} from "@ark-ui/solid/drawer";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type DrawerTitleProps = ArkTitleProps;

export function DrawerTitle(props: DrawerTitleProps) {
  traceLife("ui.drawer-title");

  return <ArkTitle {...dropAddress(props)} />;
}
