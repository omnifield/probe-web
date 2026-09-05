import {
  ListboxItemText as ArkItemText,
  type ListboxItemTextProps as ArkItemTextProps,
} from "@ark-ui/solid/listbox";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type ListboxItemTextProps = ArkItemTextProps;

export function ListboxItemText(props: ListboxItemTextProps) {
  traceLife("ui.listbox-item-text");

  return <ArkItemText {...dropAddress(props)} />;
}
