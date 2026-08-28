// EDITOR-ONLY per-part taxonomy for the popover — read by `./index.ts`'s `defineEditorInfo` call.
// Same physical shape as every other component's `playground/parts.ts` (`PWEB-127`) — one
// deliberate exception preserved from the template: `positioner` does NOT accept `trigger`/
// `anchor` (its real DOM siblings, not children — `../entity/passport.ts` explains why).

import type { PassportPartEditorInfo, PassportStateEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../entity/passport.js";

type PopoverPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

/** Open/closed — shared name/shape across `trigger`/`indicator`/`content`. */
const openClosedMeans: Readonly<Record<"open" | "closed", PassportStateEditorInfo>> = {
  open: { means: "the popover panel is showing" },
  closed: { means: "the popover panel is hidden" },
};

/** The native pseudo-class trio shared by the three real `<button>` parts. */
const pseudoMeans: Readonly<Record<"hover" | "focus-visible" | "active", PassportStateEditorInfo>> = {
  hover: { means: "pointer is over this button" },
  "focus-visible": { means: "focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise" },
  active: { means: "this button is being held down" },
};

export const parts: Readonly<Record<PopoverPart, PassportPartEditorInfo<PopoverPart>>> = {
  arrow: {
    means: "the outer clipping box for the pointing arrow",
    accepts: [{ kind: "component", name: "arrowTip" }],
  },
  arrowTip: {
    means: "the arrow's actual point — rotated into a diamond by the kit's own positioning",
    // Occupied — the arrow's own point, no consumer content.
    accepts: [],
  },
  anchor: {
    means: "an optional reference point the popover positions against, instead of the trigger",
    accepts: [{ kind: "component" }],
  },
  trigger: {
    means: "opens and closes the popover",
    states: { ...openClosedMeans, current: { means: "this is the trigger that opened the popover (multi-trigger popovers only)" }, ...pseudoMeans },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  indicator: {
    means: "open/closed glyph — the consumer places the actual icon",
    states: openClosedMeans,
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  positioner: {
    means: "positions the floating content relative to the trigger (or the anchor) — a pure wrapper, no look of its own",
    variables: {
      "--reference-width": { means: "measured width of the trigger (or anchor) the panel is positioned against" },
      "--reference-height": { means: "measured height of the trigger (or anchor) the panel is positioned against" },
      "--available-width": { means: "space left before the panel would hit the viewport edge" },
      "--available-height": { means: "space left before the panel would hit the viewport edge" },
    },
    // NOT `trigger`/`anchor` — see file header.
    accepts: [
      { kind: "component", name: "content" },
      { kind: "component", name: "arrow" },
    ],
  },
  content: {
    means: "the floating panel itself — hidden, not removed, while closed",
    states: openClosedMeans,
    accepts: [
      { kind: "component", name: "title" },
      { kind: "component", name: "description" },
      { kind: "component", name: "closeTrigger" },
      { kind: "content", genus: "text" },
      { kind: "component" },
    ],
  },
  title: {
    means: "the panel's own heading",
    accepts: [{ kind: "content", genus: "text" }],
  },
  description: {
    means: "the panel's own body text",
    accepts: [{ kind: "content", genus: "text" }],
  },
  closeTrigger: {
    means: "closes the popover",
    states: pseudoMeans,
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
};
