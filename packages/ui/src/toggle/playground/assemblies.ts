// STRUCTURAL assembly templates for the toggle — read by `./index.ts`'s `defineEditorInfo` call.
// Same physical shape as every other component's `playground/assemblies.ts` (`PWEB-127`).
//
// ONE entry: `root` wrapping one `indicator` (a star glyph) — the smallest shape that exercises
// the shared `on`/`off`/`pressed`/`disabled` states on both parts at once.

import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
// TYPE ONLY: no runtime import of the passport module here — `typeof passport` in a type
// position needs the binding's TYPE, not the module's side effects.
import type { passport } from "../entity/passport.js";

type TogglePart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const assemblies: readonly PassportAssembly<TogglePart>[] = [
  {
    name: "basic",
    means: "a pressed toggle with a star indicator",
    tree: {
      node: "root",
      props: { defaultPressed: true },
      children: [{ node: "indicator", children: [{ genus: "text", value: "★" }] }],
    },
  },
];
