// EDITOR-ONLY per-part taxonomy for the icon — read by `./index.ts`'s `defineEditorInfo` call
// (`PWEB-115`/`PWEB-118`, split out `PWEB-127`). Means and nesting — the taxonomy half of the
// editor slice; scenario data (`assemblies.ts`) is the other, split out the same way: the same
// physical shape as every other component's `playground/`, one part included.
//
// Nothing goes inside: the place is taken by the component itself, `<svg>` drawn by
// `lucide-solid` with content that does not belong to the passport. An empty list here — the
// same device as an occupied part elsewhere (`admits`, `PWEB-24`).

import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
// TYPE ONLY — see `assemblies.ts` for why: `typeof passport` needs the binding's TYPE, not the
// module's side effects.
import type { passport } from "../entity/passport.js";

type IconPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const parts: Readonly<Record<IconPart, PassportPartEditorInfo<IconPart>>> = {
  root: { means: "значок — один символ, а не произвольное содержимое", accepts: [] },
};
