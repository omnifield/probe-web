// TEMPLATE — structure prepared, prose NOT written here.
//
// EDITOR-ONLY per-part taxonomy for the avatar — read by `./index.ts`'s `defineEditorInfo` call.
// Same physical shape as every other component's `playground/parts.ts` (`PWEB-127`): one file,
// exhaustive over the anatomy, `accepts`/state KEYS true to the real Ark composition read while
// building `../entity/`.
//
// WHAT IS REAL BELOW: every part key, every state key (matches `../entity/passport.ts` exactly —
// `defineEditorInfo` throws otherwise), and every `accepts` rule (mirrors the actual Solid
// nesting: `root` wraps `image` + `fallback`, siblings).
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

type AvatarPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const visibleHiddenMeans = {
  visible: { means: "TODO" },
  hidden: { means: "TODO" },
} satisfies PassportPartEditorInfo<AvatarPart>["states"];

export const parts: Readonly<Record<AvatarPart, PassportPartEditorInfo<AvatarPart>>> = {
  root: {
    means: "TODO",
    states: {},
    accepts: [
      { kind: "part", name: "image" },
      { kind: "part", name: "fallback" },
    ],
  },
  image: {
    means: "TODO",
    states: visibleHiddenMeans,
    accepts: [],
  },
  fallback: {
    means: "TODO",
    states: visibleHiddenMeans,
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
};
