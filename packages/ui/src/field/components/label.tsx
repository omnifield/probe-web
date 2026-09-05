import {
  FieldLabel as ArkLabel,
  type FieldLabelProps as ArkLabelProps,
} from "@ark-ui/solid/field";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type FieldLabelProps = ArkLabelProps;

export function FieldLabel(props: FieldLabelProps) {
  traceLife("ui.field-label");

  return <ArkLabel {...dropAddress(props)} />;
}
