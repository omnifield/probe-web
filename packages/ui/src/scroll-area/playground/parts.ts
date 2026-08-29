// EDITOR-ONLY per-part taxonomy for the scroll area — read by `./index.ts`'s `defineEditorInfo`
// call. Same physical shape as every other component's `playground/parts.ts` (`PWEB-127`).

import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../entity/passport.js";

type ScrollAreaPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const overflowMeans = {
  "overflow-x": { means: "content overflows horizontally — a horizontal scrollbar can exist" },
  "overflow-y": { means: "content overflows vertically — a vertical scrollbar can exist" },
} satisfies PassportPartEditorInfo<ScrollAreaPart>["states"];

const orientationMeans = {
  vertical: { means: "this node is the vertical instance — scroll-area renders one of these per axis" },
  horizontal: { means: "this node is the horizontal instance — scroll-area renders one of these per axis" },
} satisfies PassportPartEditorInfo<ScrollAreaPart>["states"];

// ONE service-level fact mirrored onto three parts (`../entity/passport.ts`) — the pointer being
// anywhere near the scroll area's affordances, not literal per-node hover.
const hoverDraggingMeans = {
  hover: { means: "the pointer is anywhere near the scroll area's own scrollbar affordances right now" },
  dragging: { means: "a thumb is currently being dragged" },
} satisfies PassportPartEditorInfo<ScrollAreaPart>["states"];

export const parts: Readonly<Record<ScrollAreaPart, PassportPartEditorInfo<ScrollAreaPart>>> = {
  root: {
    means: "the whole scroll area — sizes the visible window and measures the four variables its own scrollbar/thumb/corner read back",
    states: overflowMeans,
    variables: {
      "--corner-width": { means: "measured width of the corner square" },
      "--corner-height": { means: "measured height of the corner square" },
      "--thumb-width": { means: "measured width of the vertical thumb" },
      "--thumb-height": { means: "measured height of the horizontal thumb" },
    },
    accepts: [
      { kind: "component", name: "viewport" },
      { kind: "component", name: "scrollbar" },
      { kind: "component", name: "corner" },
    ],
  },
  viewport: {
    means: "the clipping window — native overflow:auto, real scroll events",
    states: {
      ...overflowMeans,
      "at-top": { means: "scrolled all the way to the top" },
      "at-bottom": { means: "scrolled all the way to the bottom" },
      "at-left": { means: "scrolled all the way to the left" },
      "at-right": { means: "scrolled all the way to the right" },
    },
    accepts: [{ kind: "component", name: "content" }],
  },
  content: {
    means: "the scrollable content itself — sized to fit whatever the consumer puts inside it",
    states: overflowMeans,
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "component" },
    ],
  },
  scrollbar: {
    means: "one axis's own track",
    states: { ...orientationMeans, ...overflowMeans, ...hoverDraggingMeans, scrolling: { means: "a scroll is actively happening on this axis right now" } },
    accepts: [{ kind: "component", name: "thumb" }],
  },
  thumb: {
    means: "one axis's own drag handle",
    states: { ...orientationMeans, ...hoverDraggingMeans },
    accepts: [],
  },
  corner: {
    means: "the square where two scrollbars would otherwise overlap",
    states: {
      ...overflowMeans,
      hover: hoverDraggingMeans.hover,
      hidden: { means: "hidden by the skin — only one axis scrolls, nothing to fill" },
      visible: { means: "shown by the skin — both axes scroll, the corner square is needed" },
    },
    accepts: [],
  },
};
