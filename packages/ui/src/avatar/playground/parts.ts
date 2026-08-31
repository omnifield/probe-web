// EDITOR-ONLY per-part taxonomy for the avatar — read by `./index.ts`'s `defineEditorInfo` call.
// Same physical shape as every other component's `playground/parts.ts` (`PWEB-127`): one file,
// exhaustive over the anatomy, `accepts`/state KEYS true to the real Ark composition read while
// building `../entity/`.
//
// Every part key, every state key (matches `../entity/passport.ts` exactly — `defineEditorInfo`
// throws otherwise), and every `accepts` rule (mirrors the actual Solid nesting: `root` wraps
// `image` + `fallback`, siblings) is real.

import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
// TYPE ONLY — see `assemblies.ts` for why: `typeof passport` needs the binding's TYPE, not the
// module's side effects.
import type { passport } from "../entity/passport.js";

type AvatarPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const visibleHiddenMeans = {
  visible: { means: "this part is the one currently showing" },
  hidden: { means: "the other part — image and fallback are never both visible or both hidden at once" },
} satisfies PassportPartEditorInfo<AvatarPart>["states"];

export const parts: Readonly<Record<AvatarPart, PassportPartEditorInfo<AvatarPart>>> = {
  root: {
    means: "the avatar as a whole — wraps the image and its fallback",
    states: {},
    accepts: [
      { kind: "component", name: "image" },
      { kind: "component", name: "fallback" },
    ],
  },
  image: {
    means: "the picture — a real `<img>`, kept in the DOM even while hidden so its load/error events still fire",
    states: visibleHiddenMeans,
    accepts: [],
  },
  fallback: {
    means: "shown while the image hasn't loaded (or has none) — initials, an icon, whatever the consumer puts inside it",
    states: visibleHiddenMeans,
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
};
