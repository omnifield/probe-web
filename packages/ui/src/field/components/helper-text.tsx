import {
  FieldHelperText as ArkHelperText,
  type FieldHelperTextProps as ArkHelperTextProps,
} from "@ark-ui/solid/field";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type FieldHelperTextProps = ArkHelperTextProps;

export function FieldHelperText(props: FieldHelperTextProps) {
  traceLife("ui.field-helper-text");

  return <ArkHelperText {...dropAddress(props)} />;
}
