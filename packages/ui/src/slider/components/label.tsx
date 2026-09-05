import {
  SliderLabel as ArkLabel,
  type SliderLabelProps as ArkLabelProps,
} from "@ark-ui/solid/slider";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type SliderLabelProps = ArkLabelProps;

export function SliderLabel(props: SliderLabelProps) {
  traceLife("ui.slider-label");

  return <ArkLabel {...dropAddress(props)} />;
}
