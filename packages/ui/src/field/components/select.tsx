import {
  FieldSelect as ArkSelect,
  type FieldSelectProps as ArkSelectProps,
} from "@ark-ui/solid/field";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type FieldSelectProps = ArkSelectProps;

export function FieldSelect(props: FieldSelectProps) {
  traceLife("ui.field-select");

  return <ArkSelect {...dropAddress(props)} />;
}
