import { defineSettings, definePassport, type PassportState } from "@web-core/skin/model";
import type { ScrollAreaProps } from "../components/index.js";
import { anatomy } from "./anatomy.js";

const overflowX = { name: "overflow-x", mark: { kind: "attribute", name: "data-overflow-x" } } as const satisfies PassportState;
const overflowY = { name: "overflow-y", mark: { kind: "attribute", name: "data-overflow-y" } } as const satisfies PassportState;
const overflowStates: readonly PassportState[] = [overflowX, overflowY];

const vertical = { name: "vertical", mark: { kind: "attribute", name: "data-orientation", value: "vertical" } } as const satisfies PassportState;
const horizontal = { name: "horizontal", mark: { kind: "attribute", name: "data-orientation", value: "horizontal" } } as const satisfies PassportState;
const orientationStates: readonly PassportState[] = [vertical, horizontal];

const hover = { name: "hover", mark: { kind: "attribute", name: "data-hover" } } as const satisfies PassportState;
const dragging = { name: "dragging", mark: { kind: "attribute", name: "data-dragging" } } as const satisfies PassportState;
const hoverDragging: readonly PassportState[] = [hover, dragging];

export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    {
      name: "root",
      states: overflowStates,
      variables: [
        { name: "--corner-width", setBy: "kit" },
        { name: "--corner-height", setBy: "kit" },
        { name: "--thumb-width", setBy: "kit" },
        { name: "--thumb-height", setBy: "kit" },
      ],
    },
    {
      name: "viewport",
      states: [
        ...overflowStates,
        { name: "at-top", mark: { kind: "attribute", name: "data-at-top" } },
        { name: "at-bottom", mark: { kind: "attribute", name: "data-at-bottom" } },
        { name: "at-left", mark: { kind: "attribute", name: "data-at-left" } },
        { name: "at-right", mark: { kind: "attribute", name: "data-at-right" } },
      ],
    },
    { name: "content", states: overflowStates },
    { name: "scrollbar", states: [...orientationStates, ...overflowStates, ...hoverDragging, { name: "scrolling", mark: { kind: "attribute", name: "data-scrolling" } }] },
    { name: "thumb", states: [...orientationStates, ...hoverDragging] },
    {
      name: "corner",
      states: [
        ...overflowStates,
        hover,
        { name: "hidden", mark: { kind: "attribute", name: "data-state", value: "hidden" } },
        { name: "visible", mark: { kind: "attribute", name: "data-state", value: "visible" } },
      ],
    },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  settings: defineSettings<ScrollAreaProps>()({}),
});
