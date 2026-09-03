import {
  SliderMarker as ArkMarker,
  type SliderMarkerProps as ArkMarkerProps,
} from "@ark-ui/solid/slider";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type SliderMarkerProps = ArkMarkerProps;

export function SliderMarker(props: SliderMarkerProps) {
  traceLife("ui.slider-marker");

  return <ArkMarker {...dropAddress(props)} />;
}
