import {
  MenuCheckboxItem as ArkCheckboxItem,
  type MenuCheckboxItemProps as ArkCheckboxItemProps,
} from "@ark-ui/solid/menu";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type MenuCheckboxItemProps = ArkCheckboxItemProps;

export function MenuCheckboxItem(props: MenuCheckboxItemProps) {
  traceLife("ui.menu-checkbox-item");

  return <ArkCheckboxItem {...dropAddress(props)} />;
}
