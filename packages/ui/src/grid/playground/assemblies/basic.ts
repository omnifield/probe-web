import type { PassportAssembly } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import type { passport } from "../../entity/passport.js";

type GridPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const basic: PassportAssembly<GridPart> = {
  name: "basic",
  means: "сетка из четырёх ровных ячеек",
  tree: {
    node: "root",
    children: [
      { node: "cell", children: [{ genus: "text", value: "Ячейка 1" }] },
      { node: "cell", children: [{ genus: "text", value: "Ячейка 2" }] },
      { node: "cell", children: [{ genus: "text", value: "Ячейка 3" }] },
      { node: "cell", children: [{ genus: "text", value: "Ячейка 4" }] },
    ],
  },
};
