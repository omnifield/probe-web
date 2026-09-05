import {
  SelectItem as ArkItem,
  type SelectItemProps as ArkItemProps,
} from "@ark-ui/solid/select";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type SelectItemProps = ArkItemProps;

export function SelectItem(props: SelectItemProps) {
  traceLife("ui.select-item");

  return <ArkItem {...dropAddress(props)} />;
}
