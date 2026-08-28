// EDITOR-ONLY per-part taxonomy for the workspace — read by `./index.ts`'s `defineEditorInfo`
// call (`PWEB-154`). Means and nesting — the taxonomy half of the editor slice; scenario data
// (`assemblies.ts`) is the other, split out the same way: the same physical shape as every other
// component's `playground/`.

import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
// TYPE ONLY — see `assemblies.ts` for why: `typeof passport` needs the binding's TYPE, not the
// module's side effects.
import type { passport } from "../entity/passport.js";

type WorkspacePart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const parts: Readonly<Record<WorkspacePart, PassportPartEditorInfo<WorkspacePart>>> = {
  root: {
    means: "каркас приложения целиком — держит все именованные слоты в одной сетке",
    accepts: [
      { kind: "part", name: "header" },
      { kind: "part", name: "sidebar" },
      { kind: "part", name: "main" },
      { kind: "part", name: "rightbar" },
      { kind: "part", name: "footer" },
    ],
  },
  header: {
    means: "верхняя полоса — не на всю высоту, только над показом и правой панелью",
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "component" },
    ],
  },
  sidebar: {
    means: "левая колонка — во всю высоту, рядом и с шапкой, и с показом",
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "component" },
    ],
  },
  main: {
    means: "показ — единственный слот, который есть всегда",
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "component" },
    ],
  },
  rightbar: {
    means: "правая колонка — необязательна; не положена в сборку, колонка схлопывается сама",
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "component" },
    ],
  },
  footer: {
    means: "нижняя полоса — необязательна; не положена в сборку, строка схлопывается сама",
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "component" },
    ],
  },
};
