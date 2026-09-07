import type { PassportAssembly } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";

import type { Data } from "../../entity/io.js";
import { passport } from "../../entity/passport.js";

type TypographyPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const basic: PassportAssembly<TypographyPart, string, Data> = {
  name: "basic",
  means: "текст из данных, вид настроен рецептом",
  tree: { node: "root", children: [{ genus: "text", value: { path: "/text" } }] },
};
