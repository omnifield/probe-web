// STRUCTURAL assembly templates for the flow — read by `./index.ts`'s `defineEditorInfo` call
// (split out `PWEB-127`). Same physical shape as every other component's
// `playground/assemblies.ts` — one working instance still gets its own file.
//
// Two elements, not one: the flow's whole subject is the GAP between them, and there is no gap
// between one.

import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
// TYPE ONLY: no runtime import of the passport module here — `typeof passport` in a type
// position needs the binding's TYPE, not the module's side effects.
import type { passport } from "../entity/passport.js";

type FlowPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const assemblies: readonly PassportAssembly<FlowPart>[] = [
  {
    name: "basic",
    means: "ряд из двух элементов",
    tree: {
      part: "root",
      children: [
        { part: "item", children: [{ genus: "text", value: "Первый" }] },
        { part: "item", children: [{ genus: "text", value: "Второй" }] },
      ],
    },
  },
];
