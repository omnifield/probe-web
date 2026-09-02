import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";

import type { Data } from "../../entity/io.js";
import { passport } from "../../entity/passport.js";

type AccordionPart =
  typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const base: PassportAssembly<AccordionPart, string, Data> = {
  name: "base",
  means:
    "разделы из данных: заголовок раздела на триггере, контент пустой — место под содержимое потребителя",
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
            // `variant` — not a real accordion prop, a slot's own reading of "which look to
            // preview": the showcase (`test/accordion.test.tsx`'s second block) replaces this
            // node with a live component picked by `resolved.variant`. Bound from the SAME field
            // as the item's own `value` — `id` — so a slot filling this content sees which
            // section it is without a second field carrying the same fact under a new name.
            bind: { variant: "id" },
            children: [],
          },
        ],
      },
    ],
  },
};
