import type { PassportAssembly } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";

import { passport } from "../../entity/passport.js";

type AccordionPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const actionList: PassportAssembly<AccordionPart> = {
  name: "action-list",
  means: "разделы, а в контенте каждого — настоящий Listbox из общего реестра, не своя копия",
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
              { genus: "text", value: { path: "label" } },
              { node: "controlIndicator", children: [] },
            ],
          },
          {
            node: "content",
            children: [
              {
                node: "listbox",
                bind: { items: "children", value: "activeValues" },
                props: { "data-variant": "compact" },
                children: [
                  {
                    node: "listbox.content",
                    children: [
                      {
                        node: "listbox.item",
                        repeat: { path: "children" },
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
                          { node: "listbox.itemText", children: [{ genus: "text", value: { path: "label" } }] },
                          {
                            node: "listbox.itemIndicator",
                            children: [{ node: "icon", props: { name: "check" } }],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
};
