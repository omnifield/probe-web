import {
  SliderHiddenInput as ArkHiddenInput,
  type SliderHiddenInputProps as ArkHiddenInputProps,
} from "@ark-ui/solid/slider";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type SliderHiddenInputProps = ArkHiddenInputProps;

export function SliderHiddenInput(props: SliderHiddenInputProps) {
  traceLife("ui.slider-hidden-input");

  return <ArkHiddenInput {...dropAddress(props)} />;
}
