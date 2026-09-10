import type { PassportAssembly } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";

import { passport } from "../../entity/passport.js";

type MenuPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const list: PassportAssembly<MenuPart> = {
  name: "list",
  means:
    "плоский список пунктов из данных — без групп/разделителей/подменю, те собираются вручную",
  providerProps: { defaultOpen: true },
  tree: {
    node: "positioner",
    children: [
      {
        node: "content",
        children: [
          {
            node: "item",
            repeat: { path: "/items" },
            bind: { value: "value" },
            on: {
              click: {
                event: {
                  name: "select",
                  context: { payload: { path: "" } },
                },
              },
            },
            children: [
              { node: "itemText", children: [{ genus: "text", value: { path: "label" } }] },
            ],
          },
        ],
      },
    ],
  },
};
