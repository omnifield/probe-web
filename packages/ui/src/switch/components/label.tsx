import {
  SwitchLabel as ArkLabel,
  type SwitchLabelProps as ArkLabelProps,
} from "@ark-ui/solid/switch";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type SwitchLabelProps = ArkLabelProps;

export function SwitchLabel(props: SwitchLabelProps) {
  traceLife("ui.switch-label");

  return <ArkLabel {...dropAddress(props)} />;
}
