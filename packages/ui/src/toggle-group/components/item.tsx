import {
  ToggleGroupItem as ArkItem,
  type ToggleGroupItemProps as ArkItemProps,
} from "@ark-ui/solid/toggle-group";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type ToggleGroupItemProps = ArkItemProps;

export function ToggleGroupItem(props: ToggleGroupItemProps) {
  traceLife("ui.toggle-group-item");

  return <ArkItem {...dropAddress(props)} />;
}
