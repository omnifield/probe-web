// STRUCTURAL assembly templates for the segment group — read by `./index.ts`'s `defineEditorInfo`
// call (`PWEB-127`).
//
// ONE assembly, three choices — identical composition shape to the radio group's own "basic"
// assembly (same machine, `PWEB-134`): `root` wrapping `label` + one `item` per choice + one
// shared `indicator`.
//
// Each item ALSO holds the real hidden `<input type="radio">` (`{ extra: "hiddenInput" }`,
// `PWEB-152`) — without it the preview looks right but a click never actually changes the chosen
// value: the real `onChange` lives on that exact node.

import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../entity/passport.js";

type SegmentGroupPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const assemblies: readonly PassportAssembly<SegmentGroupPart>[] = [
  {
    name: "basic",
    means: "рабочий переключатель: три варианта, пилюля едет к выбранному",
    tree: {
      part: "root",
      props: { defaultValue: "list" },
      children: [
        // `indicator` BEFORE the items, matching `../components/index.tsx`'s own doc example —
        // later siblings paint over earlier ones, so items sit visually on top of the sliding
        // pill by DOM order alone, no `z-index` required.
        { part: "label", children: [{ genus: "text", value: "Вид" }] },
        { part: "indicator" },
        {
          part: "item",
          props: { value: "list" },
          children: [
            { part: "itemControl" },
            { part: "itemText", children: [{ genus: "text", value: "Список" }] },
            { extra: "hiddenInput" },
          ],
        },
        {
          part: "item",
          props: { value: "grid" },
          children: [
            { part: "itemControl" },
            { part: "itemText", children: [{ genus: "text", value: "Плитка" }] },
            { extra: "hiddenInput" },
          ],
        },
        {
          part: "item",
          props: { value: "board" },
          children: [
            { part: "itemControl" },
            { part: "itemText", children: [{ genus: "text", value: "Доска" }] },
            { extra: "hiddenInput" },
          ],
        },
      ],
    },
  },
];
