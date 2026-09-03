import {
  MenuSeparator as ArkSeparator,
  type MenuSeparatorProps as ArkSeparatorProps,
} from "@ark-ui/solid/menu";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type MenuSeparatorProps = ArkSeparatorProps;

export function MenuSeparator(props: MenuSeparatorProps) {
  traceLife("ui.menu-separator");

  return <ArkSeparator {...dropAddress(props)} />;
}
