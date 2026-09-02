import {
  DrawerDescription as ArkDescription,
  type DrawerDescriptionProps as ArkDescriptionProps,
} from "@ark-ui/solid/drawer";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type DrawerDescriptionProps = ArkDescriptionProps;

export function DrawerDescription(props: DrawerDescriptionProps) {
  traceLife("ui.drawer-description");

  return <ArkDescription {...dropAddress(props)} />;
}
