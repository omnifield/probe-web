import type { PassportAssembly } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";

import { passport } from "../../entity/passport.js";

type DialogPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const basic: PassportAssembly<DialogPart> = {
  name: "basic",
  means: "чистая механика — открытый по умолчанию портал без единого правила своего вида, содержимое кладёт потребитель",
  providerProps: { defaultOpen: true },
  tree: { node: "content", children: [] },
};
