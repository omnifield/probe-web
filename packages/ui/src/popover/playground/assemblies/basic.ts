import type { PassportAssembly } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";

import type { Data } from "../../entity/io.js";
import { passport } from "../../entity/passport.js";

type PopoverPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const basic: PassportAssembly<PopoverPart, string, Data> = {
  name: "basic",
  means: "плавающая панель поповера сама по себе: заголовок и описание из данных, крестик закрытия, стрелка",
  providerProps: { defaultOpen: true },
  tree: {
    node: "positioner",
    children: [
      { node: "arrow", children: [{ node: "arrowTip" }] },
      {
        node: "content",
        children: [
          { node: "title", children: [{ genus: "text", value: { path: "/title" } }] },
          { node: "description", children: [{ genus: "text", value: { path: "/description" } }] },
          { node: "closeTrigger", children: [{ genus: "text", value: "✕" }] },
        ],
      },
    ],
  },
};
