import {
  CheckboxControl as ArkControl,
  type CheckboxControlProps as ArkControlProps,
} from "@ark-ui/solid/checkbox";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type CheckboxControlProps = ArkControlProps;

export function CheckboxControl(props: CheckboxControlProps) {
  traceLife("ui.checkbox-control");

  return <ArkControl {...dropAddress(props)} />;
}
