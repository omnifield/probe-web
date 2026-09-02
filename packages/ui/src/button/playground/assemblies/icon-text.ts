import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";

import type { Data } from "../../entity/io.js";
import { passport } from "../../entity/passport.js";

type ButtonPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const iconText: PassportAssembly<ButtonPart, string, Data> = {
  name: "icon-text",
  means: "кнопка с иконкой и подписью из данных вместе",
  tree: {
    node: "root",
    children: [
      { genus: "icon", value: "+" },
      { genus: "text", value: { path: "/label" } },
    ],
  },
};
