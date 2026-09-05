import {
  ToggleGroupRoot as ArkRoot,
  type ToggleGroupRootProps as ArkRootProps,
} from "@ark-ui/solid/toggle-group";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type ToggleGroupProps = ArkRootProps;

export function ToggleGroup(props: ToggleGroupProps) {
  traceLife("ui.toggle-group");

  return <ArkRoot {...dropAddress(props)} />;
}
