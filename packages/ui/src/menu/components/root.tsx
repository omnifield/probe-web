import {
  MenuRoot as ArkRoot,
  type MenuRootProps as ArkRootProps,
} from "@ark-ui/solid/menu";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type MenuProps = ArkRootProps;

export function Menu(props: MenuProps) {
  traceLife("ui.menu");

  return <ArkRoot {...dropAddress(props)} />;
}
