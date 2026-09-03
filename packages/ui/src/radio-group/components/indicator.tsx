import {
  RadioGroupIndicator as ArkIndicator,
  type RadioGroupIndicatorProps as ArkIndicatorProps,
} from "@ark-ui/solid/radio-group";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type RadioGroupIndicatorProps = ArkIndicatorProps;

export function RadioGroupIndicator(props: RadioGroupIndicatorProps) {
  traceLife("ui.radio-group-indicator");

  return <ArkIndicator {...dropAddress(props)} />;
}
