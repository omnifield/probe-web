// MAP of the slider: passport part → the component that draws it (`PWEB-84`).
//
// `hiddenInput` sits outside the map — it has no part in the passport (`../entity/anatomy.ts`),
// and the map has nothing to address it with: map keys are checked against the anatomy's parts,
// not against every node the components render.

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import {
  Slider,
  SliderControl,
  SliderDraggingIndicator,
  SliderLabel,
  SliderMarker,
  SliderMarkerGroup,
  SliderRange,
  SliderThumb,
  SliderTrack,
  SliderValueText,
} from "./index.jsx";

/** The slider's passport together with whatever draws each of its ten parts. */
export const kit = defineKitComponent(passport, {
  root: Slider,
  label: SliderLabel,
  thumb: SliderThumb,
  valueText: SliderValueText,
  track: SliderTrack,
  range: SliderRange,
  control: SliderControl,
  markerGroup: SliderMarkerGroup,
  marker: SliderMarker,
  draggingIndicator: SliderDraggingIndicator,
});
