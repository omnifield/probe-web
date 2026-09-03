import {
  SliderDraggingIndicator as ArkDraggingIndicator,
  type SliderDraggingIndicatorProps as ArkDraggingIndicatorProps,
} from "@ark-ui/solid/slider";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type SliderDraggingIndicatorProps = ArkDraggingIndicatorProps;

export function SliderDraggingIndicator(props: SliderDraggingIndicatorProps) {
  traceLife("ui.slider-dragging-indicator");

  return <ArkDraggingIndicator {...dropAddress(props)} />;
}
