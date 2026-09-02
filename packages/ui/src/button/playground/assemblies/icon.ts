import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";

import type { Data } from "../../entity/io.js";
import { passport } from "../../entity/passport.js";

type ButtonPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const icon: PassportAssembly<ButtonPart, string, Data> = {
  name: "icon",
  means: "кнопка только с иконкой, без подписи — нужен свой `aria-label` у потребителя",
  tree: { node: "root", children: [{ genus: "icon", value: "✕" }] },
};
