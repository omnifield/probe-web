// EDITOR-ONLY per-part taxonomy for the surface — read by `./index.ts`'s `defineEditorInfo` call
// (`PWEB-115`/`PWEB-118`, split out `PWEB-127`). Means and nesting — the taxonomy half of the
// editor slice; scenario data (`assemblies.ts`) is the other, split out the same way: the same
// physical shape as every other component's `playground/`, one part included.

import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
// TYPE ONLY — see `assemblies.ts` for why: `typeof passport` needs the binding's TYPE, not the
// module's side effects.
import type { passport } from "../entity/passport.js";

type SurfacePart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const parts: Readonly<Record<SurfacePart, PassportPartEditorInfo<SurfacePart>>> = {
  root: {
    means: "плоскость — фон, рамка, тень и скругление отделяют содержимое от того, что под ним",
    // Внутрь кладут что угодно: плоскость на то и плоскость, что не знает, что на ней лежит.
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "component" },
    ],
  },
};
