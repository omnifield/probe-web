import {
  DrawerGrabberIndicator as ArkGrabberIndicator,
  type DrawerGrabberIndicatorProps as ArkGrabberIndicatorProps,
} from "@ark-ui/solid/drawer";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type DrawerGrabberIndicatorProps = ArkGrabberIndicatorProps;

export function DrawerGrabberIndicator(props: DrawerGrabberIndicatorProps) {
  traceLife("ui.drawer-grabber-indicator");

  return <ArkGrabberIndicator {...dropAddress(props)} />;
}
