import type { PassportAssembly } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";

import type { Data } from "../../entity/io.js";
import { passport } from "../../entity/passport.js";

type ButtonPart =
  typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const iconOnly: PassportAssembly<ButtonPart, string, Data> = {
  name: "icon-only",
  means:
    "кнопка без видимой подписи — один узел Icon внутри, та же подпись из данных уходит в aria-label, не в текст",
  tree: {
    node: "root",
    bind: { "aria-label": "/label" },
    on: {
      click: {
        event: {
          name: "onClick",
          context: { payload: { path: "" } },
        },
      },
    },
    children: [{ node: "icon", props: { name: "check" } }],
  },
};
