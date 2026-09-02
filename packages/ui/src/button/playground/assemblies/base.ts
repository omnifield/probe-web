import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";

import type { Data } from "../../entity/io.js";
import { passport } from "../../entity/passport.js";

type ButtonPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const base: PassportAssembly<ButtonPart, string, Data> = {
  name: "base",
  means: "кнопка с подписью из данных",
  tree: { node: "root", children: [{ genus: "text", value: { path: "/label" } }] },
};
