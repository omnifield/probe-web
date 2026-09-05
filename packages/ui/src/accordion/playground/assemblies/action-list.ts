import type { PassportAssembly } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";

import type { Data } from "../../entity/io.js";
import { passport } from "../../entity/passport.js";

type AccordionPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const actionList: PassportAssembly<AccordionPart, string, Data> = {
  name: "action-list",
  means: "разделы, а в контенте каждого — настоящий Listbox из общего реестра, не своя копия",
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
              { node: "controlIndicator", children: [] },
            ],
          },
          {
            node: "content",
            children: [
              {
                node: "listbox",
                bind: { items: "items", value: "activeValues" },
                props: { "data-variant": "compact" },
                children: [
                  {
                    node: "listbox.content",
                    children: [
                      {
                        node: "listbox.item",
                        repeat: { path: "items" },
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
                          { node: "listbox.itemIndicator", children: [{ genus: "icon", value: "✓" }] },
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
