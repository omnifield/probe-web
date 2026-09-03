import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";

import type { Data } from "../../entity/io.js";
import { passport } from "../../entity/passport.js";

type ToggleGroupPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const basic: PassportAssembly<ToggleGroupPart, string, Data> = {
  name: "basic",
  means: "ряд кнопок из данных",
  tree: {
    node: "root",
    children: [
      {
        node: "item",
        repeat: { path: "/items" },
        bind: { value: "value" },
        children: [{ genus: "text", value: { path: "label" } }],
      },
    ],
  },
};
