export { Slider, type SliderProps } from "./root.js";
export { SliderLabel, type SliderLabelProps } from "./label.js";
export { SliderValueText, type SliderValueTextProps } from "./value-text.js";
export { SliderControl, type SliderControlProps } from "./control.js";
export { SliderTrack, type SliderTrackProps } from "./track.js";
export { SliderRange, type SliderRangeProps } from "./range.js";
export { SliderThumb, type SliderThumbProps } from "./thumb/index.js";
export { SliderHiddenInput, type SliderHiddenInputProps } from "./thumb/hidden-input.js";
export { SliderDraggingIndicator, type SliderDraggingIndicatorProps } from "./thumb/dragging-indicator.js";
export { SliderMarkerGroup, type SliderMarkerGroupProps } from "./marker-group/index.js";
export { SliderMarker, type SliderMarkerProps } from "./marker-group/marker.js";

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { Slider } from "./root.js";
import { SliderLabel } from "./label.js";
import { SliderValueText } from "./value-text.js";
import { SliderControl } from "./control.js";
import { SliderTrack } from "./track.js";
import { SliderRange } from "./range.js";
import { SliderThumb } from "./thumb/index.js";
import { SliderMarkerGroup } from "./marker-group/index.js";
import { SliderMarker } from "./marker-group/marker.js";
import { SliderDraggingIndicator } from "./thumb/dragging-indicator.js";

export const kit = defineKitComponent(passport, {
  root: Slider,
  label: SliderLabel,
  valueText: SliderValueText,
  control: SliderControl,
  track: SliderTrack,
  range: SliderRange,
  thumb: SliderThumb,
  markerGroup: SliderMarkerGroup,
  marker: SliderMarker,
  draggingIndicator: SliderDraggingIndicator,
});
