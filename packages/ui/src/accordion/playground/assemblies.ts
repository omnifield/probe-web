import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";

import { passport } from "../entity/passport.js";

type AccordionPart =
  typeof passport extends ComponentPassport<infer Part> ? Part : never;

// ДВЕ ГОТОВЫЕ, УЖЕ СОБРАННЫЕ СХЕМЫ (постановка user, 2026-08-28) — не скелет с дырами, дыры
// заполнены здесь прямо в объявлении, ради обкатки одного куска потока: `{ component: "…" }`
// ссылается на ДРУГОЙ компонент общего реестра (`PWEB-166`) и реально рисуется. Скелет/дыры/
// наряд — отдельный, следующий шаг.
export const assemblies: readonly PassportAssembly<AccordionPart>[] = [
  {
    name: "с-кнопками",
    means:
      "разделы, а в контенте каждого — настоящая Button из общего реестра, не своя копия",
    tree: {
      node: "root",
      children: [
        {
          node: "item",
          repeat: { path: "/sections" },
          bind: { value: "id" },
          children: [
            {
              node: "itemTrigger",
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
                {
                  node: "itemIndicator",
                  children: [
                    // {
                    //   node: "icon",
                    //   props: {
                    //     "data-variant": "arrow-down",
                    //   },
                    // },
                  ],
                },
              ],
            },
            {
              node: "itemContent",
              children: [
                {
                  node: "button",
                  repeat: { path: "items" },
                  bind: { value: "id", label: "title", payload: "" },
                  props: { "data-variant": "primary" },
                },
              ],
            },
          ],
        },
      ],
    },
  },
];
