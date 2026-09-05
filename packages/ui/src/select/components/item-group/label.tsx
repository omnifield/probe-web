import {
  SelectItemGroupLabel as ArkItemGroupLabel,
  type SelectItemGroupLabelProps as ArkItemGroupLabelProps,
} from "@ark-ui/solid/select";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type SelectItemGroupLabelProps = ArkItemGroupLabelProps;

export function SelectItemGroupLabel(props: SelectItemGroupLabelProps) {
  traceLife("ui.select-item-group-label");

  return <ArkItemGroupLabel {...dropAddress(props)} />;
}
