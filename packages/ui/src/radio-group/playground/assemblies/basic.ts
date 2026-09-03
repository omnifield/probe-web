import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";

import type { Data } from "../../entity/io.js";
import { passport } from "../../entity/passport.js";

type RadioGroupPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const basic: PassportAssembly<RadioGroupPart, string, Data> = {
  name: "basic",
  means: "подпись и пункты, оба из данных, скользящий указатель едет к выбранному",
  tree: {
    node: "root",
    children: [
      { node: "label", children: [{ genus: "text", value: { path: "/label" } }] },
      {
        node: "item",
        repeat: { path: "/items" },
        bind: { value: "value" },
        children: [
          { node: "itemControl" },
          { node: "itemText", children: [{ genus: "text", value: { path: "label" } }] },
        ],
      },
      { node: "indicator" },
    ],
  },
};
