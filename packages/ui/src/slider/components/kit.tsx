import {
  SliderControl as ArkControl,
  SliderDraggingIndicator as ArkDraggingIndicator,
  SliderHiddenInput as ArkHiddenInput,
  SliderLabel as ArkLabel,
  SliderMarker as ArkMarker,
  SliderMarkerGroup as ArkMarkerGroup,
  SliderRange as ArkRange,
  SliderRoot as ArkRoot,
  SliderThumb as ArkThumb,
  SliderTrack as ArkTrack,
  SliderValueText as ArkValueText,
  type SliderControlProps as ArkControlProps,
  type SliderDraggingIndicatorProps as ArkDraggingIndicatorProps,
  type SliderHiddenInputProps as ArkHiddenInputProps,
  type SliderLabelProps as ArkLabelProps,
  type SliderMarkerGroupProps as ArkMarkerGroupProps,
  type SliderMarkerProps as ArkMarkerProps,
  type SliderRangeProps as ArkRangeProps,
  type SliderRootProps as ArkRootProps,
  type SliderThumbProps as ArkThumbProps,
  type SliderTrackProps as ArkTrackProps,
  type SliderValueTextProps as ArkValueTextProps,
} from "@ark-ui/solid/slider";

import { dropAddress } from "../../utils/slot-chain.js";
import { traceLife } from "../../utils/trace.js";

// Slider — one or several values picked by dragging along a track, from Ark
// (`ark-ui.com/docs/components/slider`).
//
// Same device as the rest of the Ark-provided kit: anatomy is Ark's (re-exported straight from
// `@zag-js/slider`, `../entity/anatomy.ts`), the address is set by Ark itself (spreads
// `parts.*.attrs` inside every `getXxxProps()`, `slider.connect.mjs`), wrappers are thin,
// `dropAddress` strips any address arriving from OUTSIDE so a node never lies about what it is
// (`PWEB-46`).
//
// `SliderThumb`/`SliderMarker` each render MULTIPLE times per slider — one `thumb` per value
// (`index` is required), one `marker` per tick (`value` is required).

/** Props of `Slider` — the root. */
export type SliderProps = ArkRootProps;

/**
 * The slider's root — holds the value(s), min/max/step, and the orientation.
 *
 * @example
 * ```tsx
 * <Slider defaultValue={[40]}>
 *   <SliderLabel>Volume</SliderLabel>
 *   <SliderValueText />
 *   <SliderControl>
 *     <SliderTrack>
 *       <SliderRange />
 *     </SliderTrack>
 *     <SliderThumb index={0}>
 *       <SliderHiddenInput />
 *     </SliderThumb>
 *   </SliderControl>
 * </Slider>
 * ```
 */
export function Slider(props: SliderProps) {
  traceLife("ui.slider");

  return <ArkRoot {...dropAddress(props)} />;
}

/** Props of `SliderLabel`. */
export type SliderLabelProps = ArkLabelProps;

/** The slider's own label — ONE node, `<label>`; clicking it focuses the first thumb. */
export function SliderLabel(props: SliderLabelProps) {
  traceLife("ui.slider-label");

  return <ArkLabel {...dropAddress(props)} />;
}

/** Props of `SliderValueText`. */
export type SliderValueTextProps = ArkValueTextProps;

/** The current value(s) as text — ONE node; the text itself is the consumer's own (`api.value`). */
export function SliderValueText(props: SliderValueTextProps) {
  traceLife("ui.slider-value-text");

  return <ArkValueText {...dropAddress(props)} />;
}

/** Props of `SliderControl`. */
export type SliderControlProps = ArkControlProps;

/** The draggable surface — ONE node; a pointer-down anywhere on it jumps the nearest thumb there. */
export function SliderControl(props: SliderControlProps) {
  traceLife("ui.slider-control");

  return <ArkControl {...dropAddress(props)} />;
}

/** Props of `SliderTrack`. */
export type SliderTrackProps = ArkTrackProps;

/** The full-length track — ONE node, wraps `range`. */
export function SliderTrack(props: SliderTrackProps) {
  traceLife("ui.slider-track");

  return <ArkTrack {...dropAddress(props)} />;
}

/** Props of `SliderRange`. */
export type SliderRangeProps = ArkRangeProps;

/** The filled portion of the track — ONE node, positioned by the kit between the origin and the value(s). */
export function SliderRange(props: SliderRangeProps) {
  traceLife("ui.slider-range");

  return <ArkRange {...dropAddress(props)} />;
}

/** Props of `SliderThumb`. */
export type SliderThumbProps = ArkThumbProps;

/** One draggable handle — a real, focusable node (`role="slider"`); `index` is required. */
export function SliderThumb(props: SliderThumbProps) {
  traceLife("ui.slider-thumb");

  return <ArkThumb {...dropAddress(props)} />;
}

/** Props of `SliderHiddenInput`. */
export type SliderHiddenInputProps = ArkHiddenInputProps;

/**
 * One thumb's real, hidden `<input type="text">` — form participation only.
 *
 * Carries no address (`../entity/passport.ts`, "the hidden input, again"): a part the provider
 * never addressed is not addressable by us either.
 */
export function SliderHiddenInput(props: SliderHiddenInputProps) {
  traceLife("ui.slider-hidden-input");

  return <ArkHiddenInput {...dropAddress(props)} />;
}

/** Props of `SliderMarkerGroup`. */
export type SliderMarkerGroupProps = ArkMarkerGroupProps;

/** Wraps every `marker` — ONE node, `aria-hidden` (decorative, not part of the accessible name). */
export function SliderMarkerGroup(props: SliderMarkerGroupProps) {
  traceLife("ui.slider-marker-group");

  return <ArkMarkerGroup {...dropAddress(props)} />;
}

/** Props of `SliderMarker`. */
export type SliderMarkerProps = ArkMarkerProps;

/** One tick mark along the track — `value` is required; no graphic of its own. */
export function SliderMarker(props: SliderMarkerProps) {
  traceLife("ui.slider-marker");

  return <ArkMarker {...dropAddress(props)} />;
}

/** Props of `SliderDraggingIndicator`. */
export type SliderDraggingIndicatorProps = ArkDraggingIndicatorProps;

/**
 * A tooltip-like marker that tracks whichever thumb is being dragged — hidden by the kit while
 * nothing is being dragged; `index` names WHICH thumb it follows.
 */
export function SliderDraggingIndicator(props: SliderDraggingIndicatorProps) {
  traceLife("ui.slider-dragging-indicator");

  return <ArkDraggingIndicator {...dropAddress(props)} />;
}

// MAP of the slider: passport part → the component that draws it (`PWEB-84`).
//
// `hiddenInput` sits outside the map — it has no part in the passport (`../entity/anatomy.ts`),
// and the map has nothing to address it with: map keys are checked against the anatomy's parts,
// not against every node the components render.

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";

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
