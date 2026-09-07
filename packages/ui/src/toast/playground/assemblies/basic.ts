import type { PassportAssembly } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import type { passport } from "../../entity/passport.js";

type ToastPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const basic: PassportAssembly<ToastPart> = {
  name: "basic",
  means: "голый root, доказывает, что паспорт собирается — не финальная форма",
  tree: { node: "root", children: [{ genus: "text", value: "Сообщение" }] },
};
