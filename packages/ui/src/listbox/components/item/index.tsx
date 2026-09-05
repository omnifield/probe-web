import {
  ListboxItem as ArkItem,
  type ListboxItemProps as ArkItemProps,
} from "@ark-ui/solid/listbox";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type ListboxItemProps = ArkItemProps;

export function ListboxItem(props: ListboxItemProps) {
  traceLife("ui.listbox-item");

  return <ArkItem {...dropAddress(props)} />;
}
