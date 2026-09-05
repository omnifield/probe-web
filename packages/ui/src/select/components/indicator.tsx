import {
  SelectIndicator as ArkIndicator,
  type SelectIndicatorProps as ArkIndicatorProps,
} from "@ark-ui/solid/select";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type SelectIndicatorProps = ArkIndicatorProps;

export function SelectIndicator(props: SelectIndicatorProps) {
  traceLife("ui.select-indicator");

  return <ArkIndicator {...dropAddress(props)} />;
}
