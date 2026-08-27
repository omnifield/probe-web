// STRUCTURAL assembly templates for the table — read by `./index.ts`'s `defineEditorInfo` call
// (`PWEB-127`).
//
// ONE node, no children: `root`'s default structure (`../components/index.tsx`, "the second real
// caller") builds head + body itself from `columns`/`data` — the same live `table` a hand-written
// render prop would get, sorting genuinely works. The eight other parts stay real, addressable
// (a skin styles `headerCell`/`cell`/… the same as any other part), they just never need to be
// literal nodes in THIS tree: the root grows them at render time.

import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../entity/passport.js";

type TablePart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const assemblies: readonly PassportAssembly<TablePart>[] = [
  {
    name: "basic",
    means: "рабочая таблица: три строки, сортировка по имени работает кликом",
    tree: {
      part: "root",
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
        defaultSorting: { columnId: "name", desc: false },
      },
    },
  },
];
