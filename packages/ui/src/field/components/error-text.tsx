import {
  FieldErrorText as ArkErrorText,
  type FieldErrorTextProps as ArkErrorTextProps,
} from "@ark-ui/solid/field";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type FieldErrorTextProps = ArkErrorTextProps;

export function FieldErrorText(props: FieldErrorTextProps) {
  traceLife("ui.field-error-text");

  return <ArkErrorText {...dropAddress(props)} />;
}
