import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";

import { passport } from "../../entity/passport.js";

type TreeViewPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const groups: PassportAssembly<TreeViewPart> = {
  name: "groups",
  means: "два уровня — группа и её пункты, каждый кликабелен и шлёт наружу свой узел целиком",
  tree: {
    node: "root",
    children: [
      {
        node: "item",
        repeat: { path: "/items" },
        bind: { node: "" },
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
            children: [
              {
                node: "item",
                repeat: { path: "children" },
                bind: { node: "" },
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
                  { node: "content", children: [] },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
};
