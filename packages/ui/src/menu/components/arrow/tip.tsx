import {
  MenuArrowTip as ArkArrowTip,
  type MenuArrowTipProps as ArkArrowTipProps,
} from "@ark-ui/solid/menu";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type MenuArrowTipProps = ArkArrowTipProps;

export function MenuArrowTip(props: MenuArrowTipProps) {
  traceLife("ui.menu-arrow-tip");

  return <ArkArrowTip {...dropAddress(props)} />;
}
