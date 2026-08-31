// STRUCTURAL assembly template for the listbox — read by `./index.ts`'s `defineEditorInfo` call.
// Same physical shape as every other component's `playground/assemblies.ts`.
//
// SKELETON ONLY — no data, no literal content, no `.map()` building children from local arrays
// (`PWEB-187` continuation, 2026-08-30, corrected after a first pass that hardcoded real country/
// city names right here — the button's own `playground/assemblies.ts` is the standing example:
// `{ genus: "text", value: { path: "/label" } }`, never a literal string). This one has exactly
// the same shape, plus a `repeat` for the one thing that is legitimately part of a LAYOUT, not
// data: "here is a list of however many rows the data brings" (page "Assembly — layout, not
// data", point 1 — `repeat` never names a count, only that one exists).
//
// `label`/`items` bind to the exact field names `../entity/io.ts` declares — an assembly and the
// component's own form are two views of the same contract, not two independent guesses at it.
// `item`'s `bind: { item: "" }` — the empty path means "the whole current repeat element"
// (`packages/skin/src/passport-assembly.ts`'s `scopedPath`, the same device the accordion's own
// `action-list` assembly uses for `payload: ""`) — it hands `ListboxItem` the SAME object
// `Listbox`'s own `items` prop holds at that index, which is what Ark's `item` prop expects.
//
// `itemIndicator` carries a literal checkmark (`{ genus: "icon", value: "✓" }`), the same device
// `menu`'s own `playground/assemblies.ts` already uses for its checkbox item — a fixed glyph is
// LAYOUT, not data: every listbox marks its checked item the same way, no dataset picks a
// different symbol per row.

import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../entity/passport.js";

type ListboxPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const assemblies: readonly PassportAssembly<ListboxPart>[] = [
  {
    name: "basic",
    means: "a label and an item list — both from data, showing as many items as there are",
    tree: {
      node: "root",
      bind: { items: "/items" },
      children: [
        { node: "label", children: [{ genus: "text", value: { path: "/label" } }] },
        {
          node: "content",
          children: [
            {
              node: "item",
              repeat: { path: "/items" },
              bind: { item: "" },
              children: [
                { node: "itemText", children: [{ genus: "text", value: { path: "label" } }] },
                { node: "itemIndicator", children: [{ genus: "icon", value: "✓" }] },
              ],
            },
          ],
        },
      ],
    },
  },
];
