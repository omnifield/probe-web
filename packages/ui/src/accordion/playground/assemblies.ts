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
      part: "acardionRoot",
      children: [
        {
          part: "acardionItem",
          repeat: { path: "/sections" },
          bind: { value: "id" },
          children: [
            {
              part: "acardionItemTrigger",
              children: [
                {
                  part: "button",
                  props: {
                    "data-variant": "tertiary",
                    label: "/title",
                    payload: "this",
                  },
                },
                {
                  part: "acardionItemIndicator",
                  children: [
                    {
                      part: "icon",
                      props: {
                        "data-variant": "arrow-down",
                      },
                    },
                  ],
                },
              ],
            },
            {
              part: "acardionItemContent",
              children: [
                {
                  part: "button",
                  repeat: { path: "/items" },
                  bind: { value: "id" },
                  props: {
                    "data-variant": "tertiary",
                    label: "/title",
                    payload: "this",
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  },
];
