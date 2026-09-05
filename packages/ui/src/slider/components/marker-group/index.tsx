import {
  SliderMarkerGroup as ArkMarkerGroup,
  type SliderMarkerGroupProps as ArkMarkerGroupProps,
} from "@ark-ui/solid/slider";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type SliderMarkerGroupProps = ArkMarkerGroupProps;

export function SliderMarkerGroup(props: SliderMarkerGroupProps) {
  traceLife("ui.slider-marker-group");

  return <ArkMarkerGroup {...dropAddress(props)} />;
}
