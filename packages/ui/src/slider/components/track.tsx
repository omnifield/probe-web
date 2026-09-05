import {
  SliderTrack as ArkTrack,
  type SliderTrackProps as ArkTrackProps,
} from "@ark-ui/solid/slider";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type SliderTrackProps = ArkTrackProps;

export function SliderTrack(props: SliderTrackProps) {
  traceLife("ui.slider-track");

  return <ArkTrack {...dropAddress(props)} />;
}
