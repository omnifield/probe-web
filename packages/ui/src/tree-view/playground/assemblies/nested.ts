import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";

import { passport } from "../../entity/passport.js";

type TreeViewPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

// `Data` intentionally NOT threaded — see `./base.ts`'s own header: `TreeItem` is
// self-referential, and `Paths<T>`'s recursion bound (`packages/skin/src/passport/assembly/
// paths.ts`) deliberately fails closed for exactly this shape, not a bug to work around here.

/**
 * ДВА уровня, не полная рекурсия. Верхние узлы всегда рисуются веткой, вложенные — всегда
 * листом: у сборки нет способа спросить данные «у тебя есть дети?» и выбрать часть по ответу —
 * `PassportAssembly` объявляет структуру заранее, она не ветвится по значению. Настоящая
 * произвольная вложенность (папка внутри папки, сколько угодно уровней) поэтому не заводится
 * здесь как один общий пример — `entity/io.ts`'s `TreeItem` рекурсивен и это переживёт, но КОНКРЕТНАЯ
 * сборка на неограниченную глубину — отдельная задача, когда появится реальный потребитель
 * (заводить её просто «для полноты» — натягивать то, что никто не просил).
 */
export const nested: PassportAssembly<TreeViewPart> = {
  name: "nested",
  means: "два уровня — верхние узлы всегда ветки, их дети всегда листья",
  tree: {
    node: "root",
    children: [
      {
        node: "tree",
        children: [
          {
            extra: "nodeProvider",
            indexPathBind: "indexPath",
            repeat: { path: "/items" },
            bind: { node: "" },
            children: [
              {
                node: "branch",
                children: [
                  {
                    node: "branchControl",
                    children: [{ node: "branchText", children: [{ genus: "text", value: { path: "label" } }] }],
                  },
                  {
                    node: "branchContent",
                    children: [
                      {
                        extra: "nodeProvider",
                        // Накопленный путь — `[индекс ветки, индекс листа]`, не только свой —
                        // движок сам ведёт его через оба уровня повтора.
                        indexPathBind: "indexPath",
                        repeat: { path: "children" },
                        bind: { node: "" },
                        children: [
                          {
                            node: "item",
                            children: [{ node: "itemText", children: [{ genus: "text", value: { path: "label" } }] }],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
};
