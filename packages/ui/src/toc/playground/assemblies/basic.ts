import type { PassportAssembly } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";

import type { Data } from "../../entity/io.js";
import { passport } from "../../entity/passport.js";

type TocPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const basic: PassportAssembly<TocPart, string, Data> = {
  name: "basic",
  means: "заголовки из данных ведут список ссылок; сам контент — слот, его наполняет потребитель",
  tree: {
    node: "root",
    bind: { items: "/items" },
    children: [
      { node: "content", children: [] },
      {
        node: "nav",
        children: [
          { node: "title", children: [{ genus: "text", value: "На этой странице" }] },
          {
            node: "list",
            children: [
              { node: "indicator" },
              {
                node: "item",
                repeat: { path: "/items" },
                bind: { item: "" },
                children: [
                  {
                    node: "link",
                    bind: { href: "href" },
                    children: [{ genus: "text", value: { path: "label" } }],
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
