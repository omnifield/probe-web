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
      part: "root",
      children: [
        {
          repeat: { path: "/sections" },
          template: {
            part: "item",
            bind: { value: "id" },
            children: [
              {
                part: "itemTrigger",
                on: {
                  click: {
                    event: {
                      name: "toggle",
                      context: { section: { path: "id" } },
                    },
                  },
                },
                children: [
                  { genus: "text", value: { path: "title" } },
                  {
                    part: "itemIndicator",
                    children: [{ genus: "icon", value: "▾" }],
                  },
                ],
              },
              {
                part: "itemContent",
                children: [
                  {
                    component: "button",
                    props: { "data-variant": "tertiary" },
                    children: [{ genus: "text", value: { path: "body" } }],
                  },
                ],
              },
            ],
          },
        },
      ],
    },
  },
  {
    name: "с-тогглами",
    means:
      "тот же темплейт разделов, а в контенте — настоящий Toggle из общего реестра",
    tree: {
      part: "root",
      children: [
        {
          repeat: { path: "/sections" },
          template: {
            part: "item",
            bind: { value: "id" },
            children: [
              {
                part: "itemTrigger",
                on: {
                  click: {
                    event: {
                      name: "toggle",
                      context: { section: { path: "id" } },
                    },
                  },
                },
                children: [
                  { genus: "text", value: { path: "title" } },
                  {
                    part: "itemIndicator",
                    children: [{ genus: "icon", value: "▾" }],
                  },
                ],
              },
              {
                part: "itemContent",
                children: [
                  {
                    component: "toggle",
                    children: [{ genus: "text", value: { path: "body" } }],
                  },
                ],
              },
            ],
          },
        },
      ],
    },
  },
];
