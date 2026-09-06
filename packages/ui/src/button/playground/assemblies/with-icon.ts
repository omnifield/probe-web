import type { PassportAssembly } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";

import type { Data } from "../../entity/io.js";
import { passport } from "../../entity/passport.js";

type ButtonPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const withIcon: PassportAssembly<ButtonPart, string, Data> = {
  name: "with-icon",
  means: "кнопка с иконкой перед подписью из данных — настоящий Icon из общего реестра, не своя копия",
  tree: {
    node: "root",
    children: [
      { node: "icon", props: { name: "check" } },
      { genus: "text", value: { path: "/label" } },
    ],
  },
};
