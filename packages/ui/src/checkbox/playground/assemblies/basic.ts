import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";

import type { Data } from "../../entity/io.js";
import { passport } from "../../entity/passport.js";

type CheckboxPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const basic: PassportAssembly<CheckboxPart, string, Data> = {
  name: "basic",
  means: "чекбокс с подписью из данных, рамкой и указателем отметки",
  tree: {
    node: "root",
    children: [
      {
        node: "control",
        children: [{ node: "indicator", children: [{ genus: "text", value: "✓" }] }],
      },
      { node: "label", children: [{ genus: "text", value: { path: "/label" } }] },
    ],
  },
};
