import type { PassportAssembly } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";

import type { Data } from "../../entity/io.js";
import { passport } from "../../entity/passport.js";

type SliderPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const basic: PassportAssembly<SliderPart, string, Data> = {
  name: "basic",
  means: "рабочий слайдер: подпись и начальное значение из данных, один бегунок",
  tree: {
    node: "root",
    bind: { defaultValue: "/defaultValue" },
    children: [
      { node: "label", children: [{ genus: "text", value: { path: "/label" } }] },
      { node: "valueText", children: [{ genus: "text", value: { path: "/defaultValue" } }] },
      {
        node: "control",
        children: [
          { node: "track", children: [{ node: "range" }] },
          { node: "thumb", props: { index: 0 } },
        ],
      },
    ],
  },
};
