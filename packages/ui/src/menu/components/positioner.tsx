import {
  MenuPositioner as ArkPositioner,
  type MenuPositionerProps as ArkPositionerProps,
} from "@ark-ui/solid/menu";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type MenuPositionerProps = ArkPositionerProps;

export function MenuPositioner(props: MenuPositionerProps) {
  traceLife("ui.menu-positioner");

  return <ArkPositioner {...dropAddress(props)} />;
}
