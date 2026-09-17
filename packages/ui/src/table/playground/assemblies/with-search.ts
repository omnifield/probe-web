import type { PassportAssembly } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";

import type { Data } from "../../entity/io.js";
import type { passport } from "../../entity/passport.js";

type TablePart =
  typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const withSearch: PassportAssembly<TablePart, string, Data> = {
  name: "with-search",
  means:
    "та же рабочая таблица, что и basic, плюс globalFilter под внешний контроль — ситуация " +
    "«нужен живой поиск», не форма данных. Само поле ввода — отдельный узел вне таблицы (см. " +
    "README §IO), сюда приходит только текущее значение фильтра.",
  tree: {
    node: "root",
    bind: {
      data: "/data",
      columns: "/columns",
      defaultSorting: "/defaultSorting",
      globalFilter: "/globalFilter",
    },
  },
};
