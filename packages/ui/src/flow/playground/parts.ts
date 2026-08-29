// EDITOR-ONLY per-part taxonomy for the flow — read by `./index.ts`'s `defineEditorInfo` call
// (`PWEB-115`, split out `PWEB-127`). Means and nesting — the taxonomy half of the editor slice;
// scenario data (`assemblies.ts`) is the other, split out the same way: the same physical shape
// as every other component's `playground/`, two parts included.

import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
// TYPE ONLY — see `assemblies.ts` for why: `typeof passport` needs the binding's TYPE, not the
// module's side effects.
import type { passport } from "../entity/passport.js";

type FlowPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const parts: Readonly<Record<FlowPart, PassportPartEditorInfo<FlowPart>>> = {
  root: {
    means: "поток — элементы идут друг за другом по одной оси; какой именно, говорит скин",
    accepts: [
      { kind: "component", name: "item" },
      { kind: "content", genus: "text" },
      { kind: "component" },
    ],
  },
  item: {
    means: "место одного элемента в потоке — им адресуется «этот тянется, остальные по содержимому»",
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "component" },
    ],
  },
};
