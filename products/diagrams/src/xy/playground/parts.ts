// TEMPLATE — structure prepared, prose NOT written here.
//
// EDITOR-ONLY per-part taxonomy for the xy family — read by `./index.ts`'s `defineEditorInfo`
// call. Same physical shape as every kit component's `playground/parts.ts` (`PWEB-127`): one
// file, exhaustive over the anatomy, `accepts`/state KEYS true to what `../components/index.tsx`
// actually renders.
//
// WHAT IS REAL BELOW: every part key, every state key (matches `../entity/passport.ts` exactly —
// `defineEditorInfo` throws otherwise), and the `accepts` rule (`root` wraps `axis`, the only
// child so far — series layers join this list as they're built, roadmap milestone 2).
//
// WHAT IS A PLACEHOLDER: every `means: "TODO"` — human-facing prose, left for whoever fills the
// playground zone next.

import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../entity/passport.js";

type XyPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const parts: Readonly<Record<XyPart, PassportPartEditorInfo<XyPart>>> = {
  root: {
    means: "TODO",
    states: {},
    accepts: [{ kind: "part", name: "axis" }],
  },
  axis: {
    means: "TODO",
    states: {
      x: { means: "TODO" },
      y: { means: "TODO" },
    },
    accepts: [],
  },
};
