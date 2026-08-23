// Модель и адресация: дерево, обратный ход, поддерево, разрешение адреса, разбор адреса.
//
// Пробы разрешения адреса перенесены из `src/__tests__/resolve.test.ts` старого репозитория
// (109 строк) — предмет тот же, изменилось только имя вызова и то, что теперь возвращается
// `unknown`. Остальное здесь новое: прежняя механика адреса части не знала, потому что не
// знала и паспортов.

import { describe, expect, it } from "vitest";

import { createRegistry, knownComponents, readAddress, resolveComponent } from "../src/registry.js";
import { resolveAddress } from "../src/resolve.js";
import { ancestorsOf, nodeOf, rootOf, subtreeOf, type AssemblyTree } from "../src/tree.js";
import { spec } from "./passports.js";

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

describe("разрешение адреса", () => {
  const map = { button: Component, ui: { forms: { field: Component } } };

  it("идёт по адресу через точку", () => {
    expect(resolveAddress(map, "button")).toBe(Component);
    expect(resolveAddress(map, "ui.forms.field")).toBe(Component);
  });

  it("отдаёт `undefined` на несуществующий адрес и на пустой", () => {
    expect(resolveAddress(map, "нет")).toBeUndefined();
    expect(resolveAddress(map, "ui.forms.нет")).toBeUndefined();
    expect(resolveAddress(map, "ui.нет.field")).toBeUndefined();
    expect(resolveAddress(map, "")).toBeUndefined();
  });

  it("помнит найденное и промахи — по одному реестру, не путая соседний", () => {
    const first = { same: Component };
    const second = { same: () => null };

    expect(resolveAddress(first, "same")).toBe(Component);
    expect(resolveAddress(second, "same")).not.toBe(Component);
    expect(resolveAddress(first, "same")).toBe(Component);
  });

  it("отдаёт ветку карты как есть — решение принимает вызывающий", () => {
    expect(resolveAddress(map, "ui")).toBe(map.ui);
  });
});

describe("реестр", () => {
  const registry = createRegistry(
    spec({ layout: Component, button: Component, icon: Component, accordion: { itemTrigger: Component } }),
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

  it("отдаёт компонент по адресу, а ветку карты — нет", () => {
    expect(resolveComponent(registry, "button")).toBe(Component);
    expect(resolveComponent(registry, "accordion.itemTrigger")).toBe(Component);
    expect(resolveComponent(registry, "accordion")).toBeUndefined();
    expect(resolveComponent(registry, "нет")).toBeUndefined();
  });

  it("перечисляет известные компоненты по адресу", () => {
    expect(knownComponents(registry)).toEqual([
      "accordion",
      "button",
      "half",
      "icon",
      "layout",
      "popover",
      "ui.button",
      "открытый",
    ]);
  });
});
