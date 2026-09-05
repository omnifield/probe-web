import {
  ListboxItemGroup as ArkItemGroup,
  type ListboxItemGroupProps as ArkItemGroupProps,
} from "@ark-ui/solid/listbox";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type ListboxItemGroupProps = ArkItemGroupProps;

export function ListboxItemGroup(props: ListboxItemGroupProps) {
  traceLife("ui.listbox-item-group");

  return <ArkItemGroup {...dropAddress(props)} />;
}
