import {
  ListboxLabel as ArkLabel,
  type ListboxLabelProps as ArkLabelProps,
} from "@ark-ui/solid/listbox";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type ListboxLabelProps = ArkLabelProps;

export function ListboxLabel(props: ListboxLabelProps) {
  traceLife("ui.listbox-label");

  return <ArkLabel {...dropAddress(props)} />;
}
