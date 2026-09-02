import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";

import { passport } from "../../entity/passport.js";

type TreeViewPart =
  typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const base: PassportAssembly<TreeViewPart> = {
  name: "base",
  means:
    "один уровень, каждый лист подписан и кликабелен, свой клик шлёт наружу, есть открытый слот под лишнее",
  tree: {
    node: "root",
    children: [
      {
        node: "item",
        repeat: { path: "/items" },
        bind: { node: "" },
        indexPathBind: "indexPath",
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
              { genus: "text", value: { path: "label" } },
              { node: "controlIndicator", children: [] },
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
