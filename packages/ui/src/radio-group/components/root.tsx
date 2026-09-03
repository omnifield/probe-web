import {
  RadioGroupRoot as ArkRoot,
  type RadioGroupRootProps as ArkRootProps,
} from "@ark-ui/solid/radio-group";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type RadioGroupProps = ArkRootProps;

export function RadioGroup(props: RadioGroupProps) {
  traceLife("ui.radio-group");

  return <ArkRoot {...dropAddress(props)} />;
}
