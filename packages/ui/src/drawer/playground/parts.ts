// TEMPLATE — structure prepared, prose NOT written here.
//
// EDITOR-ONLY per-part taxonomy for the drawer — read by `./index.ts`'s `defineEditorInfo` call.
// Same physical shape as every other component's `playground/parts.ts` (`PWEB-127`): one file,
// exhaustive over the anatomy, `accepts`/state KEYS true to the real Ark composition read while
// building `../entity/`.
//
// WHAT IS REAL BELOW: every part key, every state key (matches `../entity/passport.ts` exactly —
// `defineEditorInfo` throws otherwise), and every `accepts` rule (mirrors the doc-comment example
// in `../components/index.tsx`: `positioner` wraps `content`, which wraps `grabber` (holding
// `grabberIndicator`) + `title` + `description` + `closeTrigger`. `trigger`/`backdrop`/
// `swipeArea` are real DOM siblings of `positioner`, the same limitation the popover's/dialog's
// own templates already name).
//
// WHAT IS A PLACEHOLDER: every `means: "TODO"` — human-facing prose, left for whoever fills the
// playground zone next. Replace each one; do not remove or rename a key while doing it, or
// `defineEditorInfo` will throw at build time (parts/states are checked against the passport
// EXACTLY, not a superset).

import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
// TYPE ONLY — see `assemblies.ts` for why: `typeof passport` needs the binding's TYPE, not the
// module's side effects.
import type { passport } from "../entity/passport.js";

type DrawerPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const openClosedMeans = {
  open: { means: "TODO" },
  closed: { means: "TODO" },
} satisfies PassportPartEditorInfo<DrawerPart>["states"];

const swipeDirectionMeans = {
  up: { means: "TODO" },
  down: { means: "TODO" },
  left: { means: "TODO" },
  right: { means: "TODO" },
} satisfies PassportPartEditorInfo<DrawerPart>["states"];

const buttonPseudoMeans = {
  hover: { means: "TODO" },
  "focus-visible": { means: "TODO" },
  active: { means: "TODO" },
} satisfies PassportPartEditorInfo<DrawerPart>["states"];

export const parts: Readonly<Record<DrawerPart, PassportPartEditorInfo<DrawerPart>>> = {
  positioner: {
    means: "TODO",
    states: { ...openClosedMeans, ...swipeDirectionMeans },
    accepts: [{ kind: "part", name: "content" }],
  },
  content: {
    means: "TODO",
    states: {
      ...openClosedMeans,
      ...swipeDirectionMeans,
      swiping: { means: "TODO" },
      dragging: { means: "TODO" },
      expanded: { means: "TODO" },
      "nested-drawer-open": { means: "TODO" },
      "nested-drawer-swiping": { means: "TODO" },
    },
    variables: {
      "--drawer-translate": { means: "TODO" },
      "--drawer-translate-x": { means: "TODO" },
      "--drawer-translate-y": { means: "TODO" },
      "--drawer-snap-point-offset-x": { means: "TODO" },
      "--drawer-snap-point-offset-y": { means: "TODO" },
      "--drawer-swipe-movement-x": { means: "TODO" },
      "--drawer-swipe-movement-y": { means: "TODO" },
      "--drawer-swipe-strength": { means: "TODO" },
      "--nested-drawers": { means: "TODO" },
      "--drawer-height": { means: "TODO" },
      "--drawer-frontmost-height": { means: "TODO" },
    },
    accepts: [
      { kind: "part", name: "grabber" },
      { kind: "part", name: "title" },
      { kind: "part", name: "description" },
      { kind: "part", name: "closeTrigger" },
      { kind: "content", genus: "text" },
      { kind: "content", genus: "component" },
    ],
  },
  title: {
    means: "TODO",
    states: {},
    accepts: [{ kind: "content", genus: "text" }],
  },
  description: {
    means: "TODO",
    states: {},
    accepts: [{ kind: "content", genus: "text" }],
  },
  trigger: {
    means: "TODO",
    states: { ...openClosedMeans, current: { means: "TODO" }, ...buttonPseudoMeans },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  backdrop: {
    means: "TODO",
    states: { ...openClosedMeans, swiping: { means: "TODO" } },
    variables: {
      "--drawer-swipe-progress": { means: "TODO" },
      "--drawer-swipe-strength": { means: "TODO" },
    },
    accepts: [],
  },
  grabber: {
    means: "TODO",
    states: { hover: { means: "TODO" }, active: { means: "TODO" } },
    accepts: [{ kind: "part", name: "grabberIndicator" }],
  },
  grabberIndicator: {
    means: "TODO",
    states: {},
    accepts: [],
  },
  closeTrigger: {
    means: "TODO",
    states: buttonPseudoMeans,
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  swipeArea: {
    means: "TODO",
    states: { ...openClosedMeans, ...swipeDirectionMeans, swiping: { means: "TODO" }, disabled: { means: "TODO" } },
    accepts: [],
  },
};
