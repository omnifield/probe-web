import type { PassportAssembly } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";

import type { Data } from "../../entity/io.js";
import { passport } from "../../entity/passport.js";

type TabsPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const basic: PassportAssembly<TabsPart, string, Data> = {
  name: "basic",
  means: "рабочие табы из данных, полоса едет под выбранным",
  tree: {
    node: "root",
    children: [
      {
        node: "list",
        children: [
          {
            node: "trigger",
            repeat: { path: "/items" },
            bind: { value: "value" },
            children: [{ genus: "text", value: { path: "label" } }],
          },
          { node: "indicator" },
        ],
      },
      {
        node: "content",
        repeat: { path: "/items" },
        bind: { value: "value" },
        children: [{ genus: "text", value: { path: "content" } }],
      },
    ],
  },
};
