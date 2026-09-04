import type { PassportAssembly } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import type { passport } from "../../entity/passport.js";

type SurfacePart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const basic: PassportAssembly<SurfacePart> = {
  name: "basic",
  means: "поверхность с содержимым",
  tree: { node: "root", children: [{ genus: "text", value: "Поверхность" }] },
};
