import {
  FieldRequiredIndicator as ArkRequiredIndicator,
  type FieldRequiredIndicatorProps as ArkRequiredIndicatorProps,
} from "@ark-ui/solid/field";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type FieldRequiredIndicatorProps = ArkRequiredIndicatorProps;

export function FieldRequiredIndicator(props: FieldRequiredIndicatorProps) {
  traceLife("ui.field-required-indicator");

  return <ArkRequiredIndicator {...dropAddress(props)} />;
}
