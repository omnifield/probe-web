// STRUCTURAL assembly templates for the workspace — read by `./index.ts`'s `defineEditorInfo`
// call (`PWEB-154`). Same physical shape as every other component's `playground/assemblies.ts`.
//
// TWO assemblies, not one: the whole point of `rightbar` being optional is that the layout
// collapses cleanly without it (`../components/index.tsx`'s own header, `playground/recipe.ts`'s
// own explanation of how) — a single assembly could never prove that, since it would always show
// exactly one shape.

import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
// TYPE ONLY: no runtime import of the passport module here — `typeof passport` in a type
// position needs the binding's TYPE, not the module's side effects.
import type { passport } from "../entity/passport.js";

type WorkspacePart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const assemblies: readonly PassportAssembly<WorkspacePart>[] = [
  {
    name: "basic",
    means: "все четыре слота сразу: шапка, рельсы, показ, боковая панель",
    tree: {
      part: "root",
      children: [
        { part: "sidebar", children: [{ genus: "text", value: "Рельсы" }] },
        { part: "header", children: [{ genus: "text", value: "Шапка" }] },
        { part: "main", children: [{ genus: "text", value: "Показ" }] },
        { part: "rightbar", children: [{ genus: "text", value: "Панель" }] },
      ],
    },
  },
  {
    name: "no-rightbar",
    means: "без боковой панели — колонка под неё схлопывается сама, без места в сборке",
    tree: {
      part: "root",
      children: [
        { part: "sidebar", children: [{ genus: "text", value: "Рельсы" }] },
        { part: "header", children: [{ genus: "text", value: "Шапка" }] },
        { part: "main", children: [{ genus: "text", value: "Показ" }] },
      ],
    },
  },
];
