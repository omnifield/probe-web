import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";

import type { Data } from "../../entity/io.js";
import { passport } from "../../entity/passport.js";

type AccordionPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const actionList: PassportAssembly<AccordionPart, string, Data> = {
  name: "action-list",
  means: "разделы, а в контенте каждого — настоящий Listbox из общего реестра, не своя копия",
  tree: {
    node: "root",
    children: [
      {
        node: "item",
        repeat: { path: "/sections" },
        bind: { value: "id" },
        children: [
          {
            node: "control",
            props: { "data-variant": "secondary" },
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
              { node: "controlIndicator", children: [] },
            ],
          },
          {
            node: "content",
            children: [
              {
                // ONE node, not a `repeat` — a listbox takes the whole `items` array itself
                // (its own internal iteration, `../../../listbox/components/kit.tsx`), unlike
                // the button this replaced, which needed one node PER item. Real content, real
                // registry entry (`PWEB-166`/`PWEB-172`); `compact` names the variant this
                // composition uses (`../../../listbox/playground/recipe.ts`), the same way the
                // button reference above named `primary`.
                //
                // Children mirror the listbox's OWN "basic" template
                // (`../../../listbox/playground/assemblies.ts`) — a bare reference has no
                // `selfAssembly` to unfold from (unlike the button this replaced), so the
                // compound structure is authored here, once, the same way any consumer of a
                // compound Ark component must. No `label` child: the section's own trigger
                // already carries the title, and repeating it inside the content would say the
                // same thing twice.
                node: "listbox",
                // `value` is CONTROLLED, bound to `activeValues` — not `defaultValue`, and no
                // `onValueChange` either: this listbox's own checked mark is not this listbox's
                // own business to decide. The consumer's `on.click` below already dispatches
                // `"select"` for navigation; whatever the consumer's data says is currently
                // routed comes back down through `activeValues` and is the ONLY thing that
                // decides the mark, the same way every other node here is driven by data, not by
                // Ark's own internal state.
                bind: { items: "items", value: "activeValues" },
                props: { "data-variant": "compact" },
                // `listbox.content`/`listbox.item`/… — DOTTED, the same `component.part`
                // address `baseAssemblyOf` gives the OWNER's own parts (`addressOf`); a bare
                // `"content"` is not own-anatomy here, so it would fall through unqualified and
                // never resolve (measured live: the root rendered, its children did not).
                children: [
                  {
                    node: "listbox.content",
                    children: [
                      {
                        node: "listbox.item",
                        repeat: { path: "items" },
                        bind: { item: "" },
                        // Same device as `control` above: `on.click` composes with the
                        // part's own native click handling (Zag's selection here, expand/
                        // collapse there) — proven live on the trigger, reused rather than
                        // rediscovered. `payload: ""` — the whole current item (`{value, label}`).
                        on: {
                          click: {
                            event: {
                              name: "select",
                              context: { payload: { path: "" } },
                            },
                          },
                        },
                        children: [
                          { node: "listbox.itemText", children: [{ genus: "text", value: { path: "label" } }] },
                          { node: "listbox.itemIndicator", children: [{ genus: "icon", value: "✓" }] },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
};
