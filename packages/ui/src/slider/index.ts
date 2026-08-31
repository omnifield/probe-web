// What leaves this folder outward.
//
// Two different things, two different readers: MARKUP is picked up by the primitives entry
// (`src/index.ts`), the PASSPORT by the `./passport` build, which walks folders and assembles the
// list itself.

export {
  Slider,
  SliderControl,
  type SliderControlProps,
  SliderDraggingIndicator,
  type SliderDraggingIndicatorProps,
  SliderHiddenInput,
  type SliderHiddenInputProps,
  SliderLabel,
  type SliderLabelProps,
  SliderMarker,
  SliderMarkerGroup,
  type SliderMarkerGroupProps,
  type SliderMarkerProps,
  type SliderProps,
  SliderRange,
  type SliderRangeProps,
  SliderThumb,
  type SliderThumbProps,
  SliderTrack,
  type SliderTrackProps,
  SliderValueText,
  type SliderValueTextProps,
} from "./components/index.js";
