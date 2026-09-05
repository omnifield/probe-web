import {
  ListboxItemGroupLabel as ArkItemGroupLabel,
  type ListboxItemGroupLabelProps as ArkItemGroupLabelProps,
} from "@ark-ui/solid/listbox";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type ListboxItemGroupLabelProps = ArkItemGroupLabelProps;

export function ListboxItemGroupLabel(props: ListboxItemGroupLabelProps) {
  traceLife("ui.listbox-item-group-label");

  return <ArkItemGroupLabel {...dropAddress(props)} />;
}
