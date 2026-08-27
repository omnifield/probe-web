// EDITOR-ONLY per-part taxonomy for the grid — read by `./index.ts`'s `defineEditorInfo` call
// (`PWEB-115`, split out `PWEB-127`). Means and nesting — the taxonomy half of the editor slice;
// scenario data (`assemblies.ts`) is the other, split out the same way: the same physical shape
// as every other component's `playground/`, two parts included.

import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
// TYPE ONLY — see `assemblies.ts` for why: `typeof passport` needs the binding's TYPE, not the
// module's side effects.
import type { passport } from "../entity/passport.js";

type GridPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const parts: Readonly<Record<GridPart, PassportPartEditorInfo<GridPart>>> = {
  root: {
    means: "сетка — общие дорожки, по которым элементы выравниваются и поперёк строк",
    accepts: [
      { kind: "part", name: "cell" },
      { kind: "content", genus: "text" },
      { kind: "content", genus: "component" },
    ],
  },
  cell: {
    means: "место одного элемента в сетке — им адресуется «этот занимает две колонки»",
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "component" },
    ],
  },
};
