// STRUCTURAL assembly templates for the segment group — read by `./index.ts`'s `defineEditorInfo`
// call (`PWEB-127`).
//
// ONE assembly, three choices — identical composition shape to the radio group's own "basic"
// assembly (same machine, `PWEB-134`): `root` wrapping `label` + one `item` per choice + one
// shared `indicator`.
//
// The real hidden `<input type="radio">` is NOT named per item here (постановка user, 2026-09-01,
// README «`extras` — проверка по всему киту: кейса не нашлось ни одного») — `SegmentGroupItem`'s
// own root (`../components/kit.tsx`) already renders one per item.

import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../entity/passport.js";

type SegmentGroupPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const assemblies: readonly PassportAssembly<SegmentGroupPart>[] = [
  {
    name: "basic",
    means: "рабочий переключатель: три варианта, пилюля едет к выбранному",
    tree: {
      node: "root",
      props: { defaultValue: "list" },
      children: [
        // `indicator` BEFORE the items, matching `../components/index.tsx`'s own doc example —
        // later siblings paint over earlier ones, so items sit visually on top of the sliding
        // pill by DOM order alone, no `z-index` required.
        { node: "label", children: [{ genus: "text", value: "Вид" }] },
        { node: "indicator" },
        {
          node: "item",
          props: { value: "list" },
          children: [
            { node: "itemControl" },
            { node: "itemText", children: [{ genus: "text", value: "Список" }] },
          ],
        },
        {
          node: "item",
          props: { value: "grid" },
          children: [
            { node: "itemControl" },
            { node: "itemText", children: [{ genus: "text", value: "Плитка" }] },
          ],
        },
        {
          node: "item",
          props: { value: "board" },
          children: [
            { node: "itemControl" },
            { node: "itemText", children: [{ genus: "text", value: "Доска" }] },
          ],
        },
      ],
    },
  },
];
