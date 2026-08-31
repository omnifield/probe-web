import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";

import type { Data } from "../../entity/io.js";
import { passport } from "../../entity/passport.js";

type AccordionPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const base: PassportAssembly<AccordionPart, string, Data> = {
  name: "base",
  means: "разделы из данных: заголовок раздела на триггере, контент пустой — место под содержимое потребителя",
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
              { node: "itemIndicator", children: [] },
            ],
          },
          {
            node: "itemContent",
            bind: { variant: "id" },
            children: [],
          },
        ],
      },
    ],
  },
};
