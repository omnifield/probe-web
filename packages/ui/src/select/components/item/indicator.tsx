import {
  SelectItemIndicator as ArkItemIndicator,
  type SelectItemIndicatorProps as ArkItemIndicatorProps,
} from "@ark-ui/solid/select";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type SelectItemIndicatorProps = ArkItemIndicatorProps;

export function SelectItemIndicator(props: SelectItemIndicatorProps) {
  traceLife("ui.select-item-indicator");

  return <ArkItemIndicator {...dropAddress(props)} />;
}
