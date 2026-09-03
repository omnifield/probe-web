import {
  RadioGroupItemHiddenInput as ArkItemHiddenInput,
  type RadioGroupItemHiddenInputProps as ArkItemHiddenInputProps,
} from "@ark-ui/solid/radio-group";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type RadioGroupItemHiddenInputProps = ArkItemHiddenInputProps;

export function RadioGroupItemHiddenInput(props: RadioGroupItemHiddenInputProps) {
  traceLife("ui.radio-group-item-hidden-input");

  return <ArkItemHiddenInput {...dropAddress(props)} />;
}
