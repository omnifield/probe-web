// Модель и адресация: дерево, обратный ход, поддерево, разбор адреса, складывание пар.
//
// Прежде здесь же проверялся разрешатель адреса — спуск по вложенной карте компонентов, — и он
// СНЯТ вместе с самой картой (`PWEB-85`): реестр складывается из пар поставщика, часть берётся
// по имени, спускаться некуда. Взамен проверяется то, ради чего это делалось: у корня один
// адрес, и разрешение идёт по тому же адресу, который отдаёт разбор.

import { describe, expect, it } from "vitest";

import {
  checkRegistry,
  createRegistry,
  knownComponents,
  readAddress,
  resolveComponent,
  type ReadableComponent,
} from "../src/registry.js";
import { ancestorsOf, nodeOf, rootOf, subtreeOf, type AssemblyTree } from "../src/tree.js";
import { RULE, spec } from "./passports.js";

const Component = () => null;

const tree: AssemblyTree = {
  components: {
    root: "page",
    nodes: {
      page: { id: "page", type: "layout", parentId: null, children: ["a", "b"] },
      a: { id: "a", type: "button", parentId: "page", children: ["a-icon"] },
      "a-icon": { id: "a-icon", type: "icon", parentId: "a", children: [] },
      b: { id: "b", type: "button", parentId: "page", children: [] },
    },
  },
};

describe("дерево", () => {
  it("отдаёт узел по имени и корень", () => {
    expect(nodeOf(tree, "a")).toMatchObject({ type: "button" });
    expect(rootOf(tree)?.id).toBe("page");
  });

  it("корень, которого нет в карте, — это `undefined`, а не падение", () => {
    const broken: AssemblyTree = { components: { root: "нет", nodes: tree.components.nodes } };
    expect(rootOf(broken)).toBeUndefined();
  });

  it("поднимается по владельцам от ближнего к корню", () => {
    expect(ancestorsOf(tree, "a-icon").map((node) => node.id)).toEqual(["a", "page"]);
    expect(ancestorsOf(tree, "page")).toEqual([]);
  });

  it("не зацикливается на кольце обратных ссылок", () => {
    const looped: AssemblyTree = {
      components: {
        root: "x",
        nodes: {
          x: { id: "x", type: "layout", parentId: "y", children: [] },
          y: { id: "y", type: "layout", parentId: "x", children: [] },
        },
      },
    };
    expect(ancestorsOf(looped, "x").map((node) => node.id)).toEqual(["y"]);
  });

  it("собирает поддерево сверху вниз", () => {
    expect(subtreeOf(tree, "a")).toEqual(["a", "a-icon"]);
    expect(subtreeOf(tree, "page")).toEqual(["page", "a", "b", "a-icon"]);
    expect(subtreeOf(tree, "нет")).toEqual([]);
  });
});

describe("реестр", () => {
  const registry = createRegistry(
    spec({
      layout: Component,
      button: Component,
      icon: Component,
      accordion: Component,
      "ui.button": Component,
    }),
  );

  it("разбирает адрес компонента: часть — корневая", () => {
    expect(readAddress(registry, "button")).toMatchObject({
      component: "button",
      part: "root",
      address: "button",
    });
  });

  it("разбирает адрес части", () => {
    expect(readAddress(registry, "accordion.itemTrigger")).toMatchObject({
      component: "accordion",
      part: "itemTrigger",
      address: "accordion.itemTrigger",
    });
  });

  it("адрес корневой части и адрес компонента — одно место", () => {
    expect(readAddress(registry, "button.root")?.address).toBe("button");
    expect(readAddress(registry, "button.root")?.part).toBe("root");
  });

  it("узнаёт компонент в чужом пространстве имён", () => {
    expect(readAddress(registry, "ui.button")).toMatchObject({ component: "ui.button", part: "root" });
  });

  it("не знает адреса без паспорта и части, которой нет в анатомии", () => {
    expect(readAddress(registry, "нет")).toBeUndefined();
    expect(readAddress(registry, "button.нетТакойЧасти")).toBeUndefined();
    expect(readAddress(registry, "")).toBeUndefined();
  });

  it("отдаёт компонент по адресу — и корень достаётся тем же ходом, что часть", () => {
    expect(resolveComponent(registry, "button")).toBe(Component);
    expect(resolveComponent(registry, "accordion.itemTrigger")).toBe(Component);
    // Корень СОСТАВНОГО компонента — раньше здесь лежала ветка карты, и он не разрешался вовсе
    // (`PWEB-85`). Теперь он берётся из пары поставщика, как любая другая часть.
    expect(resolveComponent(registry, "accordion")).toBe(Component);
    expect(resolveComponent(registry, "нет")).toBeUndefined();
  });

  it("у корня ОДИН адрес: обе записи ведут в одно место и к одному компоненту", () => {
    // Второй адрес тому же узлу — это второй источник правды: сохранённые деревья разъехались бы
    // по способу записи, а скин цеплялся бы к одной из двух записей.
    const целиком = readAddress(registry, "accordion");
    const корневаяЧасть = readAddress(registry, "accordion.root");

    expect(корневаяЧасть?.address).toBe(целиком?.address);
    expect(корневаяЧасть?.part).toBe(целиком?.part);
    expect(resolveComponent(registry, "accordion.root")).toBe(
      resolveComponent(registry, "accordion"),
    );
  });

  it("разрешение идёт по ТОМУ ЖЕ адресу, который отдаёт разбор", () => {
    // Совпадение двух сторон, а не совпадение с ожиданием пробы: разъедься они — редактор
    // адресовал бы узел одним способом, а рисовал по другому.
    for (const address of knownComponents(registry)) {
      const read = readAddress(registry, address);
      expect(read?.address).toBe(address);
      expect(resolveComponent(registry, read?.address ?? "")).toBeTypeOf("function");
    }
  });

  it("перечисляет известные компоненты по адресу", () => {
    expect(knownComponents(registry)).toEqual([
      "accordion",
      "button",
      "icon",
      "layout",
      "ui.button",
    ]);
  });
});

describe("пара поставщика: паспорт и карта частей", () => {
  // `PWEB-85`. Сверку ключей делает поставщик, который её написал (кит — `defineKitComponent`),
  // но форма пары открыта любому. Приедет пара, собранная без сверки, — механика обязана назвать
  // пробел ИМЕНЕМ: неодетая часть выглядит как пустое место, и человек пойдёт чинить вёрстку.

  it("целая пара изъянов не даёт", () => {
    expect(checkRegistry(createRegistry(spec({ accordion: Component })))).toEqual([]);
  });

  it("не пара вовсе — реестр не собирается, и отказ называет адрес", () => {
    // Прежняя форма входа (карта компонентов рядом с перечнем паспортов) сюда больше не ложится.
    // Пропусти мы её молча — падение случилось бы посреди отрисовки, где его съедает граница
    // ошибок узла, и человек увидел бы пустое место вместо причины.
    expect(() =>
      createRegistry({
        components: { button: Component as unknown as ReadableComponent },
        ...RULE,
      }),
    ).toThrow(/button/);
  });

  it("часть анатомии без компонента названа именем и частью", () => {
    const дырявый = createRegistry(
      spec({ accordion: { root: Component, item: Component, itemTrigger: Component } }),
    );

    expect(checkRegistry(дырявый)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ flaw: "part-uncharted", component: "accordion", part: "itemContent" }),
        expect.objectContaining({ flaw: "part-uncharted", component: "accordion", part: "itemIndicator" }),
      ]),
    );
  });

  it("по части лежит не компонент — позвать нечего, и это тоже названо", () => {
    const мёртвый = createRegistry(spec({ button: { root: "не компонент" } }));

    expect(checkRegistry(мёртвый)).toEqual([
      expect.objectContaining({ flaw: "part-not-callable", component: "button", part: "root" }),
    ]);
    // И отрисовке такой узел не достаётся: позвать строку нечем.
    expect(resolveComponent(мёртвый, "button")).toBeUndefined();
  });

  it("в карте часть, которой нет в анатомии, — адресовать её нечем", () => {
    const лишний = createRegistry(spec({ button: { root: Component, придуманная: Component } }));

    expect(checkRegistry(лишний)).toEqual([
      expect.objectContaining({ flaw: "part-astray", component: "button", part: "придуманная" }),
    ]);
  });
});
