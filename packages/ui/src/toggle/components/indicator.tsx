import {
  ToggleIndicator as ArkIndicator,
  type ToggleIndicatorProps as ArkIndicatorProps,
} from "@ark-ui/solid/toggle";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type ToggleIndicatorProps = ArkIndicatorProps;

export function ToggleIndicator(props: ToggleIndicatorProps) {
  traceLife("ui.toggle-indicator");

  return <ArkIndicator {...dropAddress(props)} />;
}
