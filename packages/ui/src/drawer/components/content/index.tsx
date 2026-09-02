import {
  DrawerContent as ArkContent,
  type DrawerContentProps as ArkContentProps,
} from "@ark-ui/solid/drawer";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type DrawerContentProps = ArkContentProps;

export function DrawerContent(props: DrawerContentProps) {
  traceLife("ui.drawer-content");

  return <ArkContent {...dropAddress(props)} />;
}
