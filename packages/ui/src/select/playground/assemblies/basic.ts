import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";

import type { Data } from "../../entity/io.js";
import { passport } from "../../entity/passport.js";

type SelectPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const basic: PassportAssembly<SelectPart, string, Data> = {
  name: "basic",
  means: "подпись, показывающий значение триггер и список пунктов — всё из данных",
  tree: {
    node: "root",
    bind: { items: "/items" },
    children: [
      { node: "label", children: [{ genus: "text", value: { path: "/label" } }] },
      {
        node: "control",
        children: [
          {
            node: "trigger",
            children: [{ node: "valueText", bind: { placeholder: "/placeholder" } }],
          },
          { node: "indicator", children: [] },
        ],
      },
      {
        node: "positioner",
        children: [
          {
            node: "content",
            children: [
              {
                node: "item",
                repeat: { path: "/items" },
                bind: { item: "" },
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
                  { node: "itemIndicator", children: [] },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
};
