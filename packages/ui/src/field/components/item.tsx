import {
  FieldItem as ArkItem,
  type FieldItemProps as ArkItemProps,
} from "@ark-ui/solid/field";

import { traceLife } from "../../shared/utils/trace.js";

export type FieldItemProps = ArkItemProps;

export function FieldItem(props: FieldItemProps) {
  traceLife("ui.field-item");

  return <ArkItem {...props} />;
}
