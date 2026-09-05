import {
  FieldInput as ArkInput,
  type FieldInputProps as ArkInputProps,
} from "@ark-ui/solid/field";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type FieldInputProps = ArkInputProps;

export function FieldInput(props: FieldInputProps) {
  traceLife("ui.field-input");

  return <ArkInput {...dropAddress(props)} />;
}
