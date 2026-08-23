// Образец компонента и координата: с чего редактор начинает и что он обязан показать человеку.

import { describe, expect, it } from "vitest";

import {
  coordinateOfType,
  nodesByCoordinate,
  nodesSharingCoordinate,
} from "../src/coordinate.js";
import { checkTree } from "../src/integrity.js";
import { canContain } from "../src/nesting.js";
import { createRegistry } from "../src/registry.js";
import { sketchOf } from "../src/sketch.js";
import { isContent, nodeOf, type AssemblyTree } from "../src/tree.js";
import { spec } from "./passports.js";

const Component = () => null;

const registry = createRegistry(
  spec({
    layout: Component,
    button: Component,
    icon: Component,
    открытый: Component,
    accordion: { item: Component, itemTrigger: Component, itemContent: Component },
  }),
);

/**
 * Пары «узел → чем он назван» — так образец читается целиком и в одном месте.
 *
 * Содержимое названо родом, а не адресом: адреса у него нет. В образце его быть и не должно —
 * ровно это проверяет проба ниже, и такая запись показала бы его сразу.
 */
const shapeOf = (tree: AssemblyTree) =>
  Object.values(tree.components.nodes).map(
    (node) => [node.id, isContent(node) ? `содержимое:${node.genus}` : node.type] as const,
  );

describe("образец компонента", () => {
  it("у компонента с одной частью — один узел", () => {
    const sketch = sketchOf(registry, "button");

    expect(sketch?.components.root).toBe("button");
    expect(shapeOf(sketch as AssemblyTree)).toEqual([["button", "button"]]);
  });

  it("разворачивает части рекурсивно и в порядке объявления паспорта", () => {
    const sketch = sketchOf(registry, "accordion") as AssemblyTree;

    expect(shapeOf(sketch)).toEqual([
      ["accordion", "accordion"],
      ["item", "accordion.item"],
      ["itemTrigger", "accordion.itemTrigger"],
      ["itemIndicator", "accordion.itemIndicator"],
      ["itemContent", "accordion.itemContent"],
    ]);
    expect(nodeOf(sketch, "item")?.children).toEqual(["itemTrigger", "itemContent"]);
    expect(nodeOf(sketch, "itemTrigger")?.parentId).toBe("item");
  });

  it("содержимое потребителя в образец не кладётся — род не говорит, что класть", () => {
    // Паспорт кнопки допускает внутрь текст и значок. Положи механика туда подпись — она
    // решила бы за человека, что у кнопки есть текст.
    const sketch = sketchOf(registry, "button") as AssemblyTree;

    expect(Object.keys(sketch.components.nodes)).toHaveLength(1);
  });

  it("часть, не запрещающая ничего, разворачивается в один узел", () => {
    const sketch = sketchOf(registry, "открытый") as AssemblyTree;

    expect(shapeOf(sketch)).toEqual([["открытый", "открытый"]]);
  });

  it("образец законен по правилам самой механики", () => {
    const sketch = sketchOf(registry, "accordion") as AssemblyTree;

    expect(checkTree(sketch)).toEqual([]);
    for (const node of Object.values(sketch.components.nodes)) {
      if (node.parentId === null || isContent(node)) continue;
      const owner = nodeOf(sketch, node.parentId) as { type: string };
      expect(canContain(registry, owner.type, node.type)).toEqual({ allowed: true });
    }
  });

  it("имена узлов задаются вызывающим — образец кладут и в занятое дерево", () => {
    const sketch = sketchOf(registry, "accordion", {
      id: "гармошка-1",
      nameOf: (part, ordinal) => `гармошка-1-${part}-${ordinal}`,
    }) as AssemblyTree;

    expect(sketch.components.root).toBe("гармошка-1");
    expect(Object.keys(sketch.components.nodes)).toEqual([
      "гармошка-1",
      "гармошка-1-item-1",
      "гармошка-1-itemTrigger-1",
      "гармошка-1-itemIndicator-1",
      "гармошка-1-itemContent-1",
    ]);
  });

  it("часть, допускающая саму себя, разворачивается один раз — спуск конечен", () => {
    // Вложенное меню и дерево объявляются именно так, и это законная запись паспорта.
    const nested = createRegistry({
      components: {
        menu: {
          passport: {
            component: "menu",
            genus: "component",
            anatomy: { keys: () => ["root", "item"] },
            root: "root",
            parts: [
              { name: "root", accepts: [{ kind: "part", name: "item" }] },
              { name: "item", accepts: [{ kind: "part", name: "item" }] },
            ],
          },
          parts: { root: Component, item: Component },
        },
      },
      admits: (part, candidate) =>
        (part.accepts ?? []).some(
          (allowed) =>
            allowed.kind === "part" && candidate.kind === "part" && allowed.name === candidate.name,
        ),
    });

    const sketch = sketchOf(nested, "menu") as AssemblyTree;

    expect(shapeOf(sketch)).toEqual([
      ["menu", "menu"],
      ["item", "menu.item"],
    ]);
  });

  it("неизвестный адрес — `undefined`", () => {
    expect(sketchOf(registry, "нет")).toBeUndefined();
  });
});

describe("координата узла", () => {
  const page: AssemblyTree = {
    components: {
      root: "гармошка",
      nodes: {
        гармошка: { id: "гармошка", type: "accordion", parentId: null, children: ["в1", "в2"] },
        в1: { id: "в1", type: "accordion.item", parentId: "гармошка", children: ["з1"] },
        в2: { id: "в2", type: "accordion.item", parentId: "гармошка", children: [] },
        з1: { id: "з1", type: "accordion.itemTrigger", parentId: "в1", children: [] },
        чужой: { id: "чужой", type: "нет.такого", parentId: null, children: [] },
      },
    },
  };

  it("адрес компонента и адрес его корневой части — ОДНА координата", () => {
    expect(coordinateOfType(registry, "button")).toEqual({
      component: "button",
      part: "root",
      address: "button",
    });
    expect(coordinateOfType(registry, "button.root")).toEqual(coordinateOfType(registry, "button"));
  });

  it("узлы раскладываются по координатам", () => {
    const groups = nodesByCoordinate(page, registry);

    expect(groups.get("accordion.item")).toEqual(["в1", "в2"]);
    expect(groups.get("accordion")).toEqual(["гармошка"]);
    expect(groups.get("accordion.itemTrigger")).toEqual(["з1"]);
  });

  it("узел с неизвестным адресом координаты не имеет и в раскладку не попадает", () => {
    expect([...nodesByCoordinate(page, registry).values()].flat()).not.toContain("чужой");
    expect(nodesSharingCoordinate(page, registry, "чужой")).toBeUndefined();
  });

  it("показывает, кто оденется вместе с узлом", () => {
    // Человек красит одну вкладку — вид получат обе. Механика этого не запрещает, но обязана
    // показать: иначе связь открывается после покраски.
    expect(nodesSharingCoordinate(page, registry, "в1")).toEqual(["в2"]);
    expect(nodesSharingCoordinate(page, registry, "в2")).toEqual(["в1"]);
  });

  it("единственный узел своей координаты — пустой перечень, а не `undefined`", () => {
    expect(nodesSharingCoordinate(page, registry, "з1")).toEqual([]);
    expect(nodesSharingCoordinate(page, registry, "нет")).toBeUndefined();
  });
});
