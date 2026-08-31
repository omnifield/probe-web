// STRUCTURAL assembly template for the select — read by `./index.ts`'s `defineEditorInfo` call.
// Same physical shape as every other component's `playground/assemblies.ts`.
//
// SKELETON ONLY — no data, no literal content, no `.map()` building children from local arrays
// (`PWEB-195`/`PWEB-201` continuation, 2026-08-30: the previous version hardcoded real fruit
// names right here, the same mistake the listbox's own first pass made and was corrected out of
// — this one gets the same correction). The button's `playground/assemblies.ts` is the standing
// example: `{ genus: "text", value: { path: "/label" } }`, never a literal string.
//
// `label`/`items` bind to the exact field names `../entity/io.ts` declares. `item`'s
// `bind: { item: "" }` — the empty path means "the whole current repeat element"
// (`packages/skin/src/passport-assembly.ts`'s `scopedPath`, the same device the accordion's own
// `action-list` assembly uses for `payload: ""`) — it hands `SelectItem` the SAME object
// `Select`'s own `items` prop holds at that index, which is what Ark's `item` prop expects.
//
// `indicator`'s and `itemIndicator`'s children stay EMPTY, the same choice the accordion's own
// base assembly makes for its own indicator and the listbox's own skeleton now makes for its
// two: the glyph (an arrow, a checkmark) is the CONSUMER's decoration, not something a skeleton
// decides. `valueText`'s `placeholder` is bound too, not left a literal — the same reasoning as
// `label`: authored copy is data, not layout.

import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { Data } from "../entity/io.js";
import type { passport } from "../entity/passport.js";

type SelectPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const assemblies: readonly PassportAssembly<SelectPart, string, Data>[] = [
  {
    name: "basic",
    means: "a label, a value-showing trigger, and an item list — all driven by data",
    tree: {
      node: "root",
      bind: { items: "/items" },
      children: [
        { node: "label", children: [{ genus: "text", value: { path: "/label" } }] },
        {
          node: "control",
          children: [
            {
              node: "trigger",
              children: [{ node: "valueText", bind: { placeholder: "/placeholder" } }],
            },
            { node: "indicator", children: [] },
          ],
        },
        {
          node: "positioner",
          children: [
            {
              node: "content",
              children: [
                {
                  node: "item",
                  repeat: { path: "/items" },
                  bind: { item: "" },
                  // `on.click` — the same device the accordion's own `action-list` assembly uses
                  // on `listbox.item` (composes with the part's own native click handling; proven
                  // live there): a picked item's whole record goes out as `payload`, and the
                  // consumer listens for `"select"` via `RenderTree`'s `dispatch`, the SAME path
                  // every other click-driven pick in this codebase already uses
                  // (`widgets/component-list/component-list.tsx`) — not `onValueChange` as a root
                  // prop, which is not a DOM event `on` (or `dispatch`) ever sees.
                  on: {
                    click: {
                      event: {
                        name: "select",
                        context: { payload: { path: "" } },
                      },
                    },
                  },
                  children: [
                    { node: "itemText", children: [{ genus: "text", value: { path: "label" } }] },
                    { node: "itemIndicator", children: [] },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  },
];
