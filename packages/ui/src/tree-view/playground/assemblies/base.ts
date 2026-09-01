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
// BASE — root admits `~nodeProvider` DIRECTLY (postановка user, 2026-09-01: `components/kit.tsx`'s
// `TreeView` now wraps its own children in a real `TreeViewTree` internally, so the schema never
// names `tree` — root reads exactly like it has no such split, same idea `../parts.ts`'s `root`
// entry now states). `item` stays the real Ark row (`itemText`/`itemIndicator` inside it, own
// click dispatch) — never replaced, only ITS content is the draft's own call, kept as written.
export const base: PassportAssembly<TreeViewPart> = {
  name: "base",
  means:
    "один уровень, каждый лист подписан и кликабелен, свой клик шлёт наружу",
  tree: {
    node: "root",
    children: [
      {
        extra: "nodeProvider",
        indexPathBind: "indexPath",
        repeat: { path: "/items" },
        bind: { node: "" },
        children: [
          {
            node: "item",
            on: {
              click: {
                event: {
                  name: "triggerClick",
                  context: { payload: { path: "" } },
                },
              },
            },
            children: [
              {
                node: "itemContent",
                children: [],
              },
            ],
          },
        ],
      },
    ],
  },
};
