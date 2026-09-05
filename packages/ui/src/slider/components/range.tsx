import {
  SliderRange as ArkRange,
  type SliderRangeProps as ArkRangeProps,
} from "@ark-ui/solid/slider";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type SliderRangeProps = ArkRangeProps;

export function SliderRange(props: SliderRangeProps) {
  traceLife("ui.slider-range");

  return <ArkRange {...dropAddress(props)} />;
}
