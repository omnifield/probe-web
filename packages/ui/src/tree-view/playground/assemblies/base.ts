import type { PassportAssembly } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";

import { passport } from "../../entity/passport.js";

type TreeViewPart =
  typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const base: PassportAssembly<TreeViewPart> = {
  name: "base",
  means:
    "дерево произвольной глубины, каждый узел подписан и кликабелен, свой клик шлёт наружу",
  tree: {
    node: "root",
    children: [
      {
        node: "item",
        repeat: { path: "/items" },
        bind: { node: "" },
        indexPathBind: "indexPath",
        recur: { path: "children", into: "content" },
        children: [
          {
            node: "control",
            on: {
              click: {
                event: {
                  name: "controlClick",
                  context: { payload: { path: "" } },
                },
              },
            },
            children: [
              { node: "controlIndicator", children: [{ genus: "icon", value: "▶" }] },
              { genus: "text", value: { path: "label" } },
            ],
          },
          {
            node: "content",
            children: [],
          },
        ],
      },
    ],
  },
};
