import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../../entity/passport.js";

type SurfacePart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const basic: PassportAssembly<SurfacePart> = {
  name: "basic",
  means: "поверхность с содержимым",
  tree: { node: "root", children: [{ genus: "text", value: "Поверхность" }] },
};
