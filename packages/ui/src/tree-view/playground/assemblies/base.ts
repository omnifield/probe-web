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
// BASE — root admits `~nodeProvider` DIRECTLY (постановка user, 2026-09-01: `components/kit.tsx`'s
// `TreeView` wraps its own children in a real `TreeViewTree` internally, so the schema never
// names `tree`). `item` stays the real Ark row — never replaced, only filled: its own required
// label (`itemText`, same as accordion's trigger title), its own selection mark (`itemIndicator`,
// empty — glyph is the consumer's), and `itemContent` — OUR OWN real anatomy part
// (`entity/anatomy.ts`'s `extendWith`), the same open slot accordion's `itemContent` plays,
// empty here on purpose: what a consumer wants BEYOND the label is theirs to decide, never ours.
export const base: PassportAssembly<TreeViewPart> = {
  name: "base",
  means:
    "один уровень, каждый лист подписан и кликабелен, свой клик шлёт наружу, есть открытый слот под лишнее",
  tree: {
    node: "root",
    children: [
      {
        node: "item",
        repeat: { path: "/items" },
        bind: { value: "id" },
        children: [
          {
            node: "itemTrigger",
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
