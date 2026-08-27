// TEMPLATE — structure prepared, prose NOT written here.
//
// EDITOR-ONLY per-part taxonomy for the toast — read by `./index.ts`'s `defineEditorInfo` call.
// Same physical shape as every other component's `playground/parts.ts` (`PWEB-127`): one file,
// exhaustive over the anatomy, `accepts`/state KEYS true to the real Ark composition read while
// building `../entity/`.
//
// WHAT IS REAL BELOW: every part key, every state key (matches `../entity/passport.ts` exactly —
// `defineEditorInfo` throws otherwise), and every `accepts` rule (mirrors the doc-comment example
// in `../components/index.tsx`: `group` wraps one `root` per live toast, `root` wraps `title` +
// `description` + `actionTrigger` + `closeTrigger`).
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

type ToastPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const positionMeans = {
  "top-start": { means: "TODO" },
  top: { means: "TODO" },
  "top-end": { means: "TODO" },
  "bottom-start": { means: "TODO" },
  bottom: { means: "TODO" },
  "bottom-end": { means: "TODO" },
  "side-top": { means: "TODO" },
  "side-bottom": { means: "TODO" },
  "align-start": { means: "TODO" },
  "align-center": { means: "TODO" },
  "align-end": { means: "TODO" },
} satisfies PassportPartEditorInfo<ToastPart>["states"];

const buttonPseudoMeans = {
  hover: { means: "TODO" },
  "focus-visible": { means: "TODO" },
  active: { means: "TODO" },
} satisfies PassportPartEditorInfo<ToastPart>["states"];

export const parts: Readonly<Record<ToastPart, PassportPartEditorInfo<ToastPart>>> = {
  group: {
    means: "TODO",
    states: positionMeans,
    accepts: [{ kind: "part", name: "root" }],
  },
  root: {
    means: "TODO",
    states: {
      ...positionMeans,
      open: { means: "TODO" },
      closed: { means: "TODO" },
      success: { means: "TODO" },
      error: { means: "TODO" },
      loading: { means: "TODO" },
      info: { means: "TODO" },
      warning: { means: "TODO" },
      mounted: { means: "TODO" },
      paused: { means: "TODO" },
      first: { means: "TODO" },
      sibling: { means: "TODO" },
      stack: { means: "TODO" },
      overlap: { means: "TODO" },
    },
    accepts: [
      { kind: "part", name: "title" },
      { kind: "part", name: "description" },
      { kind: "part", name: "actionTrigger" },
      { kind: "part", name: "closeTrigger" },
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
  actionTrigger: {
    means: "TODO",
    states: buttonPseudoMeans,
    accepts: [{ kind: "content", genus: "text" }],
  },
  closeTrigger: {
    means: "TODO",
    states: buttonPseudoMeans,
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
};
