import {
  SwitchThumb as ArkThumb,
  type SwitchThumbProps as ArkThumbProps,
} from "@ark-ui/solid/switch";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type SwitchThumbProps = ArkThumbProps;

export function SwitchThumb(props: SwitchThumbProps) {
  traceLife("ui.switch-thumb");

  return <ArkThumb {...dropAddress(props)} />;
}
