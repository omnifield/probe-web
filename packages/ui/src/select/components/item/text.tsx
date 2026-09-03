import {
  SelectItemText as ArkItemText,
  type SelectItemTextProps as ArkItemTextProps,
} from "@ark-ui/solid/select";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type SelectItemTextProps = ArkItemTextProps;

export function SelectItemText(props: SelectItemTextProps) {
  traceLife("ui.select-item-text");

  return <ArkItemText {...dropAddress(props)} />;
}
