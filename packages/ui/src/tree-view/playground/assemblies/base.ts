import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";

import { passport } from "../../entity/passport.js";

type TreeViewPart =
  typeof passport extends ComponentPassport<infer Part> ? Part : never;

// `Data` (`entity/io.ts`) intentionally NOT threaded as the third type argument here: `TreeItem`
// is self-referential (`children?: readonly TreeItem[]`), and `Paths<T>`'s own recursion bound
// (`packages/skin/src/passport/assembly/paths.ts`, `Depth = 6`) is a DELIBERATE guard against a
// self-referential schema hanging `tsc` — its own comment names this exact case. Falling back to
// the untyped default (every component before `PWEB-209` used this, not a downgrade invented
// here) keeps `bind`/`repeat.path` as plain strings, checked only at runtime — the same trade the
// whole kit made before compile-time path-checking existed at all.
//
// 2026-09-01: "нахуя мне там айтемтекст, если там должен быть пустой узел, который юзер сам
// подставит"). This assembly does not decide `itemText` any more than accordion's own `base.ts`
// decides what fills `itemContent` — a consumer wanting a label writes their OWN component (which
// may itself be `itemText`, may be anything else) and puts it here; `item`'s `accepts` (`../
// parts.ts`) already admits a bare `{ kind: "content", genus: "text" }`, an `itemText` reference,
// or `{ kind: "component" }` (any registry component) — this file picks none of them on purpose.
export const base: PassportAssembly<TreeViewPart> = {
  name: "base",
  means:
    "минимальный скелет — один уровень, лист без потомков, узел ПУСТ: что в него класть, решает потребитель",
  tree: {
    node: "root",
    children: [
      {
        node: "item",
        repeat: { path: "/items" },
        bind: { node: "id" },
        children: [
          {
            node: "itemTrigger",
            extra: "nodeProvider",
            indexPathBind: "indexPath",
            on: {
              click: {
                event: {
                  name: "triggerClick",
                  context: { payload: { path: "" } },
                },
              },
            },
            children: [
              { genus: "text", value: { path: "title" } },
              { node: "itemIndicator", children: [] },
            ],
          },
          {
            node: "itemContent",
            children: [],
          },
        ],
      },
    ],
  },
};
