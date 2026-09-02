import {
  FieldRoot as ArkRoot,
  type FieldRootProps as ArkRootProps,
} from "@ark-ui/solid/field";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type FieldProps = ArkRootProps;

export function Field(props: FieldProps) {
  traceLife("ui.field");

  return <ArkRoot {...dropAddress(props)} />;
}
