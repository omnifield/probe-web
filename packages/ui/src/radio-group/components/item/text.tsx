import {
  RadioGroupItemText as ArkItemText,
  type RadioGroupItemTextProps as ArkItemTextProps,
} from "@ark-ui/solid/radio-group";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type RadioGroupItemTextProps = ArkItemTextProps;

export function RadioGroupItemText(props: RadioGroupItemTextProps) {
  traceLife("ui.radio-group-item-text");

  return <ArkItemText {...dropAddress(props)} />;
}
