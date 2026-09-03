import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";

import type { Data } from "../../entity/io.js";
import { passport } from "../../entity/passport.js";

type ListboxPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const basic: PassportAssembly<ListboxPart, string, Data> = {
  name: "basic",
  means: "подпись и список пунктов, оба из данных, показывает столько пунктов, сколько пришло",
  tree: {
    node: "root",
    bind: { items: "/items" },
    children: [
      { node: "label", children: [{ genus: "text", value: { path: "/label" } }] },
      {
        node: "content",
        children: [
          {
            node: "item",
            repeat: { path: "/items" },
            bind: { item: "" },
            children: [
              { node: "itemText", children: [{ genus: "text", value: { path: "label" } }] },
              { node: "itemIndicator", children: [{ genus: "icon", value: "✓" }] },
            ],
          },
        ],
      },
    ],
  },
};
