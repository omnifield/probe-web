import {
  FieldTextarea as ArkTextarea,
  type FieldTextareaProps as ArkTextareaProps,
} from "@ark-ui/solid/field";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type FieldTextareaProps = ArkTextareaProps;

export function FieldTextarea(props: FieldTextareaProps) {
  traceLife("ui.field-textarea");

  return <ArkTextarea {...dropAddress(props)} />;
}
