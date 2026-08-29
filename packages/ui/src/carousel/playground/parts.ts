// EDITOR-ONLY per-part taxonomy for the carousel — read by `./index.ts`'s `defineEditorInfo`
// call. Same physical shape as every other component's `playground/parts.ts` (`PWEB-127`): one
// file, exhaustive over the anatomy, `accepts`/state KEYS true to the real Ark composition read
// while building `../entity/`.
//
// `accepts` CORRECTED against Ark's own documented "Autoplay" example (`ark-ui.com/docs/
// components/carousel`), not left as the placement guess the template shipped with:
// `autoplayTrigger` sits INSIDE `control`, between `prevTrigger` and `nextTrigger` — not as a
// direct child of `root` — and `autoplayIndicator` sits INSIDE `autoplayTrigger` (it is the
// button's own icon-swap), not a sibling part floating at `root`. `progressText` has no
// canonical placement in any fetched example; left at `root`, the least wrong guess available.

import type { PassportPartEditorInfo, PassportStateEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../entity/passport.js";

type CarouselPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

// The shared state-name/`means` dictionary for the four real `<button>` parts (`prevTrigger`/
// `nextTrigger`/`indicator`/`autoplayTrigger`) that all carry the same native pseudo-class trio.
const pseudoMeans: Readonly<Record<"hover" | "focus-visible" | "active", PassportStateEditorInfo>> = {
  hover: { means: "pointer is over this button" },
  "focus-visible": { means: "focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise" },
  active: { means: "this button is being held down" },
};

export const parts: Readonly<Record<CarouselPart, PassportPartEditorInfo<CarouselPart>>> = {
  root: {
    means: "the whole carousel — viewport, navigation, and indicators together",
    accepts: [
      { kind: "component", name: "control" },
      { kind: "component", name: "itemGroup" },
      { kind: "component", name: "indicatorGroup" },
      { kind: "component", name: "progressText" },
    ],
  },
  itemGroup: {
    means: "the scrollable viewport that holds every slide",
    states: { dragging: { means: "the viewport is being dragged by the pointer (only when allowMouseDrag is on)" } },
    accepts: [{ kind: "component", name: "item" }],
  },
  item: {
    means: "one slide",
    states: { inview: { means: "this slide is currently visible in the viewport (crosses inViewThreshold)" } },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "component" },
    ],
  },
  control: {
    means: "wraps the previous/next navigation buttons and, when present, the autoplay toggle",
    accepts: [
      { kind: "component", name: "prevTrigger" },
      { kind: "component", name: "nextTrigger" },
      { kind: "component", name: "autoplayTrigger" },
    ],
  },
  prevTrigger: {
    means: "scrolls back one page",
    states: {
      disabled: { means: "already at the first page and the carousel does not loop — nothing to scroll back to" },
      ...pseudoMeans,
    },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  nextTrigger: {
    means: "scrolls forward one page",
    states: {
      disabled: { means: "already at the last page and the carousel does not loop — nothing to scroll forward to" },
      ...pseudoMeans,
    },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  indicatorGroup: {
    means: "wraps one indicator per slide (or per page, when slidesPerPage is more than one)",
    accepts: [{ kind: "component", name: "indicator" }],
  },
  indicator: {
    means: "one dot — jumps straight to its slide when clicked",
    states: {
      current: { means: "this dot's slide is the one currently showing" },
      readonly: { means: "clicking does nothing — the indicator was set read-only" },
      ...pseudoMeans,
    },
    // Occupied — a plain dot, styled by the skin, no content in Ark's own documented usage.
    accepts: [],
  },
  autoplayTrigger: {
    means: "starts or pauses automatic scrolling",
    states: {
      pressed: { means: "autoplay is running — this toggle is in its \"on\" state" },
      ...pseudoMeans,
    },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
      { kind: "component", name: "autoplayIndicator" },
    ],
  },
  progressText: {
    means: "page count text",
    // Occupied-but-overridable — the kit fills `"<page> / <total>"` itself when given no
    // children, the same shape the select's own `valueText` has.
    accepts: [{ kind: "content", genus: "text" }],
  },
  autoplayIndicator: {
    means: "the autoplay button's own icon — swaps between children (running) and fallback (paused); always mounted, only the content changes",
    // No states (`../entity/passport.ts`): content-conditional, not look-conditional. `children`
    // shows while playing, the `fallback` prop while paused — neither is expressible as a second
    // `accepts` list, only the general shape of what CAN go inside is.
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
};
