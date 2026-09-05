import {
  CheckboxIndicator as ArkIndicator,
  type CheckboxIndicatorProps as ArkIndicatorProps,
} from "@ark-ui/solid/checkbox";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type CheckboxIndicatorProps = ArkIndicatorProps;

export function CheckboxIndicator(props: CheckboxIndicatorProps) {
  traceLife("ui.checkbox-indicator");

  return <ArkIndicator {...dropAddress(props)} />;
}
