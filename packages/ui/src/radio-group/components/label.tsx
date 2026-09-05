import {
  RadioGroupLabel as ArkLabel,
  type RadioGroupLabelProps as ArkLabelProps,
} from "@ark-ui/solid/radio-group";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type RadioGroupLabelProps = ArkLabelProps;

export function RadioGroupLabel(props: RadioGroupLabelProps) {
  traceLife("ui.radio-group-label");

  return <ArkLabel {...dropAddress(props)} />;
}
