// STRUCTURAL assembly templates for the surface — read by `./index.ts`'s `defineEditorInfo` call
// (split out `PWEB-127`). Same physical shape as every other component's
// `playground/assemblies.ts` — one working instance still gets its own file.

import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
// TYPE ONLY: no runtime import of the passport module here — `typeof passport` in a type
// position needs the binding's TYPE, not the module's side effects.
import type { passport } from "../entity/passport.js";

type SurfacePart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const assemblies: readonly PassportAssembly<SurfacePart>[] = [
  {
    name: "basic",
    means: "поверхность с содержимым",
    tree: { node: "root", children: [{ genus: "text", value: "Поверхность" }] },
  },
];
