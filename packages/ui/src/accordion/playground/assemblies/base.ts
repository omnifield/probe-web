import type { PassportAssembly } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";

import { passport } from "../../entity/passport.js";

type AccordionPart =
  typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const base: PassportAssembly<AccordionPart> = {
  name: "base",
  means:
    "разделы из данных: заголовок раздела на триггере, контент пустой — место под содержимое потребителя",
  tree: {
    node: "root",
    children: [
      {
        node: "item",
        repeat: { path: "/items" },
        bind: { value: "value" },
        children: [
          {
            node: "control",
            on: {
              click: {
                event: {
                  name: "triggerClick",
                  context: { payload: { path: "" } },
                },
              },
            },
            children: [
              { genus: "text", value: { path: "label" } },
              { node: "controlIndicator", children: [] },
            ],
          },
          {
            node: "content",
            bind: { variant: "value" },
            children: [],
          },
        ],
      },
    ],
  },
};
