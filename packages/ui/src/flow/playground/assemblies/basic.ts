import type { PassportAssembly } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import type { passport } from "../../entity/passport.js";

type FlowPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const basic: PassportAssembly<FlowPart> = {
  name: "basic",
  means: "ряд из двух элементов",
  tree: {
    node: "root",
    children: [
      { node: "item", children: [{ genus: "text", value: "Первый" }] },
      { node: "item", children: [{ genus: "text", value: "Второй" }] },
    ],
  },
};
