import type { PassportAssembly } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import type { passport } from "../../entity/passport.js";

type IconPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const basic: PassportAssembly<IconPart> = {
  name: "basic",
  means: "одна иконка по фиксированному имени",
  tree: { node: "root", props: { name: "check" } },
};
