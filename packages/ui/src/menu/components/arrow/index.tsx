import {
  MenuArrow as ArkArrow,
  type MenuArrowProps as ArkArrowProps,
} from "@ark-ui/solid/menu";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type MenuArrowProps = ArkArrowProps;

export function MenuArrow(props: MenuArrowProps) {
  traceLife("ui.menu-arrow");

  return <ArkArrow {...dropAddress(props)} />;
}
