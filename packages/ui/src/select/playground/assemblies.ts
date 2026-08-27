// STRUCTURAL assembly templates for the select — read by `./index.ts`'s `defineEditorInfo` call
// (split out `PWEB-127`). Same physical shape as every other component's
// `playground/assemblies.ts`.
//
// `collection` is a real `ListCollection` — built by calling `createListCollection()` right here,
// same as any other functional prop a working instance needs (the accordion's `value` on its
// `item`). Nothing about it is JSON: this file is TypeScript, not a stored record, and the
// function's whole job is to wrap plain data (`{ value, label }` pairs) into the shape the
// component's own contract asks for. Each `item` node's own `props.item` points at the SAME
// object the collection holds — Ark's real usage (`ark-ui.com/docs/components/select`) does the
// identical thing, iterating `collection.items` and passing each one straight to `<SelectItem>`.

import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
// RUNTIME import, unlike every other playground/assemblies.ts: building a real `collection` needs
// the actual function, not just its type. `createListCollection` carries no Solid and no JSX of
// its own (`components/index.tsx` re-exports it precisely so a consumer never reaches past the
// kit for it) — the same subpath discipline the rest of the kit already stands on.
import { createListCollection } from "../components/index.jsx";
// TYPE ONLY: no runtime import of the passport module here — `typeof passport` in a type
// position needs the binding's TYPE, not the module's side effects.
import type { passport } from "../entity/passport.js";

type SelectPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const fruits = [
  { value: "apple", label: "Яблоко" },
  { value: "banana", label: "Банан" },
  { value: "cherry", label: "Вишня" },
];

const collection = createListCollection({ items: fruits });

export const assemblies: readonly PassportAssembly<SelectPart>[] = [
  {
    name: "basic",
    means: "рабочий селект: подпись, кнопка со значением, три пункта выбора",
    tree: {
      part: "root",
      props: { collection },
      children: [
        { part: "label", children: [{ genus: "text", value: "Фрукт" }] },
        {
          part: "control",
          children: [
            {
              part: "trigger",
              children: [{ part: "valueText", props: { placeholder: "Выберите фрукт" } }],
            },
            { part: "indicator", children: [{ genus: "icon", value: "▾" }] },
          ],
        },
        {
          part: "positioner",
          children: [
            {
              part: "content",
              children: fruits.map((fruit) => ({
                part: "item",
                props: { item: fruit },
                children: [
                  { part: "itemText", children: [{ genus: "text", value: fruit.label }] },
                  { part: "itemIndicator", children: [{ genus: "icon", value: "✓" }] },
                ],
              })),
            },
          ],
        },
      ],
    },
  },
];
