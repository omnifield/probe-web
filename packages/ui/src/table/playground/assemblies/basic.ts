import type { PassportAssembly } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";

import type { Data } from "../../entity/io.js";
import type { passport } from "../../entity/passport.js";

type TablePart =
  typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const basic: PassportAssembly<TablePart, string, Data> = {
  name: "basic",
  means:
    "рабочая таблица: строки из данных, сортировка по имени работает кликом",
  tree: {
    node: "root",
    bind: { data: "/data", columns: "/columns", defaultSorting: "/defaultSorting" },
  },
};
