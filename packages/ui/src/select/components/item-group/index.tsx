import {
  SelectItemGroup as ArkItemGroup,
  type SelectItemGroupProps as ArkItemGroupProps,
} from "@ark-ui/solid/select";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type SelectItemGroupProps = ArkItemGroupProps;

export function SelectItemGroup(props: SelectItemGroupProps) {
  traceLife("ui.select-item-group");

  return <ArkItemGroup {...dropAddress(props)} />;
}
