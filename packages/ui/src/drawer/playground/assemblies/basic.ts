import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";

import type { Data } from "../../entity/io.js";
import { passport } from "../../entity/passport.js";

type DrawerPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const basic: PassportAssembly<DrawerPart, string, Data> = {
  name: "basic",
  means: "плавающая панель шторки сама по себе: ручка, заголовок и описание из данных, крестик закрытия",
  providerProps: { defaultOpen: true },
  tree: {
    node: "positioner",
    children: [
      {
        node: "content",
        children: [
          {
            node: "grabber",
            children: [{ node: "grabberIndicator", children: [] }],
          },
          { node: "title", children: [{ genus: "text", value: { path: "/title" } }] },
          { node: "description", children: [{ genus: "text", value: { path: "/description" } }] },
          { node: "closeTrigger", children: [{ genus: "text", value: "✕" }] },
        ],
      },
    ],
  },
};
