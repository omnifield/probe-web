import {
  SliderThumb as ArkThumb,
  type SliderThumbProps as ArkThumbProps,
} from "@ark-ui/solid/slider";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type SliderThumbProps = ArkThumbProps;

export function SliderThumb(props: SliderThumbProps) {
  traceLife("ui.slider-thumb");

  return <ArkThumb {...dropAddress(props)} />;
}
