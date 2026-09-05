import {
  ToggleRoot as ArkRoot,
  type ToggleRootProps as ArkRootProps,
} from "@ark-ui/solid/toggle";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type ToggleProps = ArkRootProps;

export function Toggle(props: ToggleProps) {
  traceLife("ui.toggle");

  return <ArkRoot {...dropAddress(props)} />;
}
