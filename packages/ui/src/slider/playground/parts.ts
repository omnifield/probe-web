// TEMPLATE — structure prepared, prose NOT written here.
//
// EDITOR-ONLY per-part taxonomy for the slider — read by `./index.ts`'s `defineEditorInfo` call.
// Same physical shape as every other component's `playground/parts.ts` (`PWEB-127`): one file,
// exhaustive over the anatomy, `accepts`/state KEYS true to the real Ark composition read while
// building `../entity/`.
//
// WHAT IS REAL BELOW: every part key, every state key (matches `../entity/passport.ts` exactly —
// `defineEditorInfo` throws otherwise), and every `accepts` rule (mirrors the doc-comment example
// in `../components/index.tsx`: `root` wraps `label` + `valueText` + `control`(`track`(`range`) +
// `thumb`(`hiddenInput`)) — `markerGroup`(`marker`) and `draggingIndicator` are real siblings
// inside `control` too, per Ark's own documented composition).
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

type SliderPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const groupMeans = {
  disabled: { means: "TODO" },
  invalid: { means: "TODO" },
  dragging: { means: "TODO" },
  focus: { means: "TODO" },
} satisfies PassportPartEditorInfo<SliderPart>["states"];

export const parts: Readonly<Record<SliderPart, PassportPartEditorInfo<SliderPart>>> = {
  root: {
    means: "TODO",
    states: groupMeans,
    variables: {
      "--slider-thumb-width": { means: "TODO" },
      "--slider-thumb-height": { means: "TODO" },
      "--slider-thumb-transform": { means: "TODO" },
      "--slider-range-start": { means: "TODO" },
      "--slider-range-end": { means: "TODO" },
    },
    accepts: [
      { kind: "part", name: "label" },
      { kind: "part", name: "valueText" },
      { kind: "part", name: "control" },
    ],
  },
  label: {
    means: "TODO",
    states: groupMeans,
    accepts: [{ kind: "content", genus: "text" }],
  },
  valueText: {
    means: "TODO",
    states: { disabled: { means: "TODO" }, invalid: { means: "TODO" }, focus: { means: "TODO" } },
    accepts: [{ kind: "content", genus: "text" }],
  },
  control: {
    means: "TODO",
    states: groupMeans,
    accepts: [
      { kind: "part", name: "track" },
      { kind: "part", name: "thumb" },
      { kind: "part", name: "markerGroup" },
      { kind: "part", name: "draggingIndicator" },
    ],
  },
  track: {
    means: "TODO",
    states: groupMeans,
    accepts: [{ kind: "part", name: "range" }],
  },
  range: {
    means: "TODO",
    states: groupMeans,
    accepts: [],
  },
  thumb: {
    means: "TODO",
    states: {
      disabled: { means: "TODO" },
      focus: { means: "TODO" },
      dragging: { means: "TODO" },
      hover: { means: "TODO" },
      active: { means: "TODO" },
    },
    // `hiddenInput` is not listed — it has no part of its own to accept (`../entity/anatomy.ts`).
    accepts: [],
  },
  markerGroup: {
    means: "TODO",
    states: {},
    accepts: [{ kind: "part", name: "marker" }],
  },
  marker: {
    means: "TODO",
    states: {
      disabled: { means: "TODO" },
      "under-value": { means: "TODO" },
      "at-value": { means: "TODO" },
      "over-value": { means: "TODO" },
    },
    variables: {
      "--translate-x": { means: "TODO" },
      "--translate-y": { means: "TODO" },
    },
    accepts: [{ kind: "content", genus: "text" }],
  },
  draggingIndicator: {
    means: "TODO",
    states: { open: { means: "TODO" }, closed: { means: "TODO" } },
    accepts: [{ kind: "content", genus: "text" }],
  },
};
