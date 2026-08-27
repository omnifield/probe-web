// STRUCTURAL assembly templates for the grid — read by `./index.ts`'s `defineEditorInfo` call
// (split out `PWEB-127`). Same physical shape as every other component's
// `playground/assemblies.ts`.
//
// ONE assembly: four EQUAL cells — on one, neither columns nor rows are visible, and the grid is
// about exactly them.

import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
// TYPE ONLY: no runtime import of the passport module here — `typeof passport` in a type
// position needs the binding's TYPE, not the module's side effects.
import type { passport } from "../entity/passport.js";

type GridPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const assemblies: readonly PassportAssembly<GridPart>[] = [
  {
    name: "basic",
    means: "сетка из четырёх ровных ячеек",
    tree: {
      part: "root",
      children: [
        { part: "cell", children: [{ genus: "text", value: "Ячейка 1" }] },
        { part: "cell", children: [{ genus: "text", value: "Ячейка 2" }] },
        { part: "cell", children: [{ genus: "text", value: "Ячейка 3" }] },
        { part: "cell", children: [{ genus: "text", value: "Ячейка 4" }] },
      ],
    },
  },
];
