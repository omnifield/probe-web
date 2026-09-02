import {
  DrawerGrabber as ArkGrabber,
  type DrawerGrabberProps as ArkGrabberProps,
} from "@ark-ui/solid/drawer";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type DrawerGrabberProps = ArkGrabberProps;

export function DrawerGrabber(props: DrawerGrabberProps) {
  traceLife("ui.drawer-grabber");

  return <ArkGrabber {...dropAddress(props)} />;
}
