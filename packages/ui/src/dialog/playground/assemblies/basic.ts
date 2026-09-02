import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";

import type { Data } from "../../entity/io.js";
import { passport } from "../../entity/passport.js";

type DialogPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const basic: PassportAssembly<DialogPart, string, Data> = {
  name: "basic",
  means: "плавающая панель диалога сама по себе: заголовок и описание из данных, крестик закрытия",
  providerProps: { defaultOpen: true },
  tree: {
    node: "positioner",
    children: [
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
