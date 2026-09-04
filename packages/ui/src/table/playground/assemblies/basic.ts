import type { PassportAssembly } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import type { passport } from "../../entity/passport.js";

type TablePart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const basic: PassportAssembly<TablePart> = {
  name: "basic",
  means: "рабочая таблица: три строки, сортировка по имени работает кликом",
  tree: {
    node: "root",
    props: {
      columns: [
        { accessorKey: "name", header: "Имя" },
        { accessorKey: "role", header: "Роль" },
        { accessorKey: "age", header: "Возраст" },
      ],
      data: [
        { name: "Аня", role: "Дизайнер", age: 29 },
        { name: "Борис", role: "Инженер", age: 34 },
        { name: "Вера", role: "Менеджер", age: 41 },
      ],
      defaultSorting: [{ columnId: "name", desc: false }],
    },
  },
};
