import {
  MenuRadioItem as ArkRadioItem,
  type MenuRadioItemProps as ArkRadioItemProps,
} from "@ark-ui/solid/menu";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type MenuRadioItemProps = ArkRadioItemProps;

export function MenuRadioItem(props: MenuRadioItemProps) {
  traceLife("ui.menu-radio-item");

  return <ArkRadioItem {...dropAddress(props)} />;
}
