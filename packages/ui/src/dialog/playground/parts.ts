// TEMPLATE — structure prepared, prose NOT written here.
//
// EDITOR-ONLY per-part taxonomy for the dialog — read by `./index.ts`'s `defineEditorInfo` call.
// Same physical shape as every other component's `playground/parts.ts` (`PWEB-127`): one file,
// exhaustive over the anatomy, `accepts`/state KEYS true to the real Ark composition read while
// building `../entity/`.
//
// WHAT IS REAL BELOW: every part key, every state key (matches `../entity/passport.ts` exactly —
// `defineEditorInfo` throws otherwise), and every `accepts` rule (mirrors the actual Solid
// nesting: `positioner` wraps `content`, which wraps `title`/`description`/`closeTrigger` —
// `trigger`/`backdrop` are real DOM siblings of `positioner`, not ancestors or descendants, so
// neither appears in ANY part's `accepts`, the same limitation the popover's own template names).
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

type DialogPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const openClosedMeans = {
  open: { means: "TODO" },
  closed: { means: "TODO" },
} satisfies PassportPartEditorInfo<DialogPart>["states"];

const buttonPseudoMeans = {
  hover: { means: "TODO" },
  "focus-visible": { means: "TODO" },
  active: { means: "TODO" },
} satisfies PassportPartEditorInfo<DialogPart>["states"];

export const parts: Readonly<Record<DialogPart, PassportPartEditorInfo<DialogPart>>> = {
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
    states: openClosedMeans,
    accepts: [],
  },
  positioner: {
    means: "TODO",
    states: {},
    accepts: [{ kind: "part", name: "content" }],
  },
  content: {
    means: "TODO",
    states: openClosedMeans,
    accepts: [
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
  closeTrigger: {
    means: "TODO",
    states: buttonPseudoMeans,
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
};
