import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
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
