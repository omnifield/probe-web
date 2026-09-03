import {
  MenuIndicator as ArkIndicator,
  type MenuIndicatorProps as ArkIndicatorProps,
} from "@ark-ui/solid/menu";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type MenuIndicatorProps = ArkIndicatorProps;

export function MenuIndicator(props: MenuIndicatorProps) {
  traceLife("ui.menu-indicator");

  return <ArkIndicator {...dropAddress(props)} />;
}
