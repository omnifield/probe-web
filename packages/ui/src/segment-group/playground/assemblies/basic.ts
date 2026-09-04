import type { PassportAssembly } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";

import type { Data } from "../../entity/io.js";
import { passport } from "../../entity/passport.js";

type SegmentGroupPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const basic: PassportAssembly<SegmentGroupPart, string, Data> = {
  name: "basic",
  means: "подпись и сегменты, оба из данных, скользящая пилюля едет к выбранному",
  tree: {
    node: "root",
    children: [
      { node: "label", children: [{ genus: "text", value: { path: "/label" } }] },
      { node: "indicator" },
      {
        node: "item",
        repeat: { path: "/items" },
        bind: { value: "value" },
        children: [
          { node: "itemControl" },
          { node: "itemText", children: [{ genus: "text", value: { path: "label" } }] },
        ],
      },
    ],
  },
};
