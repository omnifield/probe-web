import {
  CheckboxLabel as ArkLabel,
  type CheckboxLabelProps as ArkLabelProps,
} from "@ark-ui/solid/checkbox";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type CheckboxLabelProps = ArkLabelProps;

export function CheckboxLabel(props: CheckboxLabelProps) {
  traceLife("ui.checkbox-label");

  return <ArkLabel {...dropAddress(props)} />;
}
