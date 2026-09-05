import {
  SliderValueText as ArkValueText,
  type SliderValueTextProps as ArkValueTextProps,
} from "@ark-ui/solid/slider";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type SliderValueTextProps = ArkValueTextProps;

export function SliderValueText(props: SliderValueTextProps) {
  traceLife("ui.slider-value-text");

  return <ArkValueText {...dropAddress(props)} />;
}
