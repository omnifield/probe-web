// EDITOR-ONLY per-part taxonomy for the drawer — read by `./index.ts`'s `defineEditorInfo` call.
// Same physical shape as every other component's `playground/parts.ts` (`PWEB-127`): one file,
// exhaustive over the anatomy, `accepts`/state KEYS true to the real Ark composition read while
// building `../entity/`.
//
// Every part key, every state key (matches `../entity/passport.ts` exactly — `defineEditorInfo`
// throws otherwise), and every `accepts` rule (mirrors the doc-comment example in
// `../components/index.tsx`: `positioner` wraps `content`, which wraps `grabber` (holding
// `grabberIndicator`) + `title` + `description` + `closeTrigger`. `trigger`/`backdrop`/
// `swipeArea` are real DOM siblings of `positioner`, the same limitation the popover's/dialog's
// own templates already name) is real.

import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
// TYPE ONLY — see `assemblies.ts` for why: `typeof passport` needs the binding's TYPE, not the
// module's side effects.
import type { passport } from "../entity/passport.js";

type DrawerPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const openClosedMeans = {
  open: { means: "the drawer is open" },
  closed: { means: "the drawer is closed" },
} satisfies PassportPartEditorInfo<DrawerPart>["states"];

const swipeDirectionMeans = {
  up: { means: "the drawer slides in from, and dismisses toward, the top" },
  down: { means: "the drawer slides in from, and dismisses toward, the bottom" },
  left: { means: "the drawer slides in from, and dismisses toward, the left edge" },
  right: { means: "the drawer slides in from, and dismisses toward, the right edge" },
} satisfies PassportPartEditorInfo<DrawerPart>["states"];

const buttonPseudoMeans = {
  hover: { means: "pointer is over this button" },
  "focus-visible": { means: "focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise" },
  active: { means: "this button is being held down" },
} satisfies PassportPartEditorInfo<DrawerPart>["states"];

export const parts: Readonly<Record<DrawerPart, PassportPartEditorInfo<DrawerPart>>> = {
  positioner: {
    means: "anchors the drawer's content to the edge it slides from",
    states: { ...openClosedMeans, ...swipeDirectionMeans },
    accepts: [{ kind: "component", name: "content" }],
  },
  content: {
    means: "the drawer's own panel",
    states: {
      ...openClosedMeans,
      ...swipeDirectionMeans,
      swiping: { means: "a drag or an opening swipe is in progress right now" },
      dragging: { means: "a drag specifically is in progress (not the post-release settle)" },
      expanded: { means: "the drawer is at its fully expanded snap point" },
      "nested-drawer-open": { means: "a drawer stacked on top of this one is open" },
      "nested-drawer-swiping": { means: "a drawer stacked on top of this one is being swiped" },
    },
    variables: {
      "--drawer-translate": { means: "the current slide offset — the same value as `--drawer-translate-y`" },
      "--drawer-translate-x": { means: "the current horizontal slide/drag offset" },
      "--drawer-translate-y": { means: "the current vertical slide/drag offset" },
      "--drawer-snap-point-offset-x": { means: "the horizontal offset of the active snap point" },
      "--drawer-snap-point-offset-y": { means: "the vertical offset of the active snap point" },
      "--drawer-swipe-movement-x": { means: "how far the current swipe gesture has moved horizontally" },
      "--drawer-swipe-movement-y": { means: "how far the current swipe gesture has moved vertically" },
      "--drawer-swipe-strength": { means: "how close the current swipe is to its dismiss threshold, as a fraction" },
      "--nested-drawers": { means: "how many drawers are stacked on top of this one" },
      "--drawer-height": { means: "the measured height of this drawer's content" },
      "--drawer-frontmost-height": { means: "the measured height of the frontmost (topmost) drawer in the stack" },
    },
    accepts: [
      { kind: "component", name: "grabber" },
      { kind: "component", name: "title" },
      { kind: "component", name: "description" },
      { kind: "component", name: "closeTrigger" },
      { kind: "content", genus: "text" },
      { kind: "component" },
    ],
  },
  title: {
    means: "the drawer's own title",
    states: {},
    accepts: [{ kind: "content", genus: "text" }],
  },
  description: {
    means: "the drawer's own description",
    states: {},
    accepts: [{ kind: "content", genus: "text" }],
  },
  trigger: {
    means: "opens the drawer",
    states: {
      ...openClosedMeans,
      current: { means: "in a multi-trigger drawer, this is the trigger that opened it" },
      ...buttonPseudoMeans,
    },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  backdrop: {
    means: "the dimmed overlay behind the drawer — fades along with the swipe gesture",
    states: { ...openClosedMeans, swiping: { means: "a drag or an opening swipe is in progress right now" } },
    variables: {
      "--drawer-swipe-progress": { means: "how far open the current swipe gesture has made the drawer, as a fraction" },
      "--drawer-swipe-strength": { means: "how close the current swipe is to its dismiss threshold, as a fraction" },
    },
    accepts: [],
  },
  grabber: {
    means: "the drag handle — a pointer-down here starts the swipe-to-dismiss gesture",
    states: { hover: { means: "pointer is over the grabber" }, active: { means: "the grabber is being held down" } },
    accepts: [{ kind: "component", name: "grabberIndicator" }],
  },
  grabberIndicator: {
    means: "the visible pull-bar inside the grabber — no graphic of its own, a skin draws the bar",
    states: {},
    accepts: [],
  },
  closeTrigger: {
    means: "closes the drawer",
    states: buttonPseudoMeans,
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  swipeArea: {
    means: "an invisible, edge-anchored gesture zone that lets a closed drawer be swiped open",
    states: {
      ...openClosedMeans,
      ...swipeDirectionMeans,
      swiping: { means: "a drag or an opening swipe is in progress right now" },
      disabled: { means: "swiping to open is disabled" },
    },
    accepts: [],
  },
};
