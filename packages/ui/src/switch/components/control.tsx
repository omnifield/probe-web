import {
  SwitchControl as ArkControl,
  type SwitchControlProps as ArkControlProps,
} from "@ark-ui/solid/switch";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type SwitchControlProps = ArkControlProps;

export function SwitchControl(props: SwitchControlProps) {
  traceLife("ui.switch-control");

  return <ArkControl {...dropAddress(props)} />;
}
