import {
  MenuContent as ArkContent,
  type MenuContentProps as ArkContentProps,
} from "@ark-ui/solid/menu";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type MenuContentProps = ArkContentProps;

export function MenuContent(props: MenuContentProps) {
  traceLife("ui.menu-content");

  return <ArkContent {...dropAddress(props)} />;
}
