import { defineSettings, definePassport, type PassportState } from "@omnifield/probe-web-skin/model";
import type { SliderProps } from "../components/index.js";
import { anatomy } from "./anatomy.js";

const disabled = { name: "disabled", mark: { kind: "attribute", name: "data-disabled" } } as const satisfies PassportState;
const invalid = { name: "invalid", mark: { kind: "attribute", name: "data-invalid" } } as const satisfies PassportState;
const dragging = { name: "dragging", mark: { kind: "attribute", name: "data-dragging" } } as const satisfies PassportState;
const focus = { name: "focus", mark: { kind: "attribute", name: "data-focus" } } as const satisfies PassportState;

const groupStates: readonly PassportState[] = [disabled, invalid, dragging, focus];

const hoverPseudo = { name: "hover", mark: { kind: "pseudo", name: ":hover" } } as const satisfies PassportState;
const activePseudo = { name: "active", mark: { kind: "pseudo", name: ":active" } } as const satisfies PassportState;

export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    {
      name: "root",
      states: groupStates,
      variables: [
        { name: "--slider-thumb-width", setBy: "kit" },
        { name: "--slider-thumb-height", setBy: "kit" },
        { name: "--slider-thumb-transform", setBy: "kit" },
        { name: "--slider-range-start", setBy: "kit" },
        { name: "--slider-range-end", setBy: "kit" },
      ],
    },
    { name: "label", states: groupStates },
    { name: "valueText", states: [disabled, invalid, focus] },
    { name: "track", states: groupStates },
    { name: "range", states: groupStates },
    { name: "control", states: groupStates },
    {
      name: "thumb",
      states: [disabled, focus, dragging, hoverPseudo, activePseudo],
    },
    { name: "markerGroup", states: [] },
    {
      name: "marker",
      states: [
        disabled,
        { name: "under-value", mark: { kind: "attribute", name: "data-state", value: "under-value" } },
        { name: "at-value", mark: { kind: "attribute", name: "data-state", value: "at-value" } },
        { name: "over-value", mark: { kind: "attribute", name: "data-state", value: "over-value" } },
      ],
      variables: [
        { name: "--translate-x", setBy: "kit" },
        { name: "--translate-y", setBy: "kit" },
      ],
    },
    {
      name: "draggingIndicator",
      states: [
        { name: "open", mark: { kind: "attribute", name: "data-state", value: "open" } },
        { name: "closed", mark: { kind: "attribute", name: "data-state", value: "closed" } },
      ],
    },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  settings: defineSettings<SliderProps>()({
    orientation: {
      values: {
        kind: "choice",
        options: [{ value: "horizontal" }, { value: "vertical" }],
      },
      byDefault: "horizontal",
      mark: { kind: "attribute", name: "data-orientation" },
    },
  }),
});
