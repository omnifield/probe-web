import {
  MenuRadioItemGroup as ArkRadioItemGroup,
  type MenuRadioItemGroupProps as ArkRadioItemGroupProps,
} from "@ark-ui/solid/menu";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type MenuRadioItemGroupProps = ArkRadioItemGroupProps;

export function MenuRadioItemGroup(props: MenuRadioItemGroupProps) {
  traceLife("ui.menu-radio-item-group");

  return <ArkRadioItemGroup {...dropAddress(props)} />;
}
