// Правки: дерево меняется, недопустимое отвергается по имени, прежнее дерево не трогается.

import { describe, expect, it } from "vitest";

import { insertNode, moveNode, removeNode, updateNode } from "../src/edits.js";
import { createRegistry } from "../src/registry.js";
import { nodeOf, type AssemblyTree } from "../src/tree.js";
import { spec } from "./passports.js";

const Component = () => null;

const registry = createRegistry(
  spec({
    layout: Component,
    button: Component,
    icon: Component,
    accordion: { item: Component, itemTrigger: Component },
  }),
);

const base: AssemblyTree = {
  components: {
    root: "page",
    nodes: {
      page: { id: "page", type: "layout", parentId: null, children: ["one", "two"] },
      one: { id: "one", type: "button", parentId: "page", children: ["mark"] },
      mark: { id: "mark", type: "icon", parentId: "one", children: [] },
      two: { id: "two", type: "button", parentId: "page", children: [] },
    },
  },
};

/** Дерево из ответа правки; падает с внятным текстом, если правка отказала. */
function grown(result: ReturnType<typeof insertNode>): AssemblyTree {
  if (!result.ok) throw new Error(`правка отказала: ${result.refusal} — ${result.means}`);
  return result.tree;
}

describe("вставка", () => {
  it("кладёт узел внутрь владельца и проставляет связи в обе стороны", () => {
    const tree = grown(insertNode(base, registry, { id: "three", type: "button" }, "page"));

    expect(nodeOf(tree, "three")).toMatchObject({ parentId: "page", children: [] });
    expect(nodeOf(tree, "page")?.children).toEqual(["one", "two", "three"]);
  });

  it("кладёт на указанное место, а место за краем прижимает к краю", () => {
    expect(
      grown(insertNode(base, registry, { id: "x", type: "button" }, "page", 0)).components.nodes
        .page.children,
    ).toEqual(["x", "one", "two"]);

    expect(
      grown(insertNode(base, registry, { id: "x", type: "button" }, "page", 99)).components.nodes
        .page.children,
    ).toEqual(["one", "two", "x"]);
  });

  it("прежнее дерево не трогает", () => {
    insertNode(base, registry, { id: "three", type: "button" }, "page");
    expect(base.components.nodes.page.children).toEqual(["one", "two"]);
    expect(nodeOf(base, "three")).toBeUndefined();
  });

  it("отвергает недопустимую вложенность именем отказа паспорта", () => {
    const result = insertNode(base, registry, { id: "inside", type: "button" }, "mark");
    expect(result).toMatchObject({ ok: false, refusal: "content-not-admitted" });
  });

  it("отвергает занятое имя и несуществующего владельца", () => {
    expect(insertNode(base, registry, { id: "one", type: "button" }, "page")).toMatchObject({
      refusal: "id-taken",
    });
    expect(insertNode(base, registry, { id: "n", type: "button" }, "нет")).toMatchObject({
      refusal: "parent-unknown",
    });
  });

  it("переносит объявленные пропы, стили и редакторское, не выдумывая пустых", () => {
    const tree = grown(
      insertNode(
        base,
        registry,
        { id: "rich", type: "button", props: { children: "Сохранить" }, styles: { root: "s" } },
        "page",
      ),
    );

    expect(nodeOf(tree, "rich")).toMatchObject({
      props: { children: "Сохранить" },
      styles: { root: "s" },
    });
    expect(nodeOf(tree, "rich")).not.toHaveProperty("meta");
  });
});

describe("удаление", () => {
  it("уносит поддерево целиком и снимает ссылку у владельца", () => {
    const tree = grown(removeNode(base, "one"));

    expect(nodeOf(tree, "one")).toBeUndefined();
    expect(nodeOf(tree, "mark")).toBeUndefined();
    expect(nodeOf(tree, "page")?.children).toEqual(["two"]);
  });

  it("корень не удаляется — без него дерева не останется", () => {
    expect(removeNode(base, "page")).toMatchObject({ ok: false, refusal: "root-locked" });
  });

  it("несуществующий узел — отказ, а не тихое согласие", () => {
    expect(removeNode(base, "нет")).toMatchObject({ refusal: "node-unknown" });
  });
});

describe("перенос", () => {
  it("переносит узел к другому владельцу", () => {
    const tree = grown(moveNode(base, registry, "mark", "two"));

    expect(nodeOf(tree, "mark")?.parentId).toBe("two");
    expect(nodeOf(tree, "one")?.children).toEqual([]);
    expect(nodeOf(tree, "two")?.children).toEqual(["mark"]);
  });

  it("переносит внутри одного владельца, не удваивая узел", () => {
    const tree = grown(moveNode(base, registry, "two", "page", 0));

    expect(nodeOf(tree, "page")?.children).toEqual(["two", "one"]);
  });

  it("отвергает перенос узла внутрь самого себя и внутрь своего потомка", () => {
    expect(moveNode(base, registry, "one", "one")).toMatchObject({ refusal: "into-own-subtree" });
    expect(moveNode(base, registry, "one", "mark")).toMatchObject({ refusal: "into-own-subtree" });
  });

  it("отвергает перенос корня и проверяет вложенность на новом месте", () => {
    expect(moveNode(base, registry, "page", "one")).toMatchObject({ refusal: "root-locked" });

    const intoIcon = moveNode(base, registry, "two", "mark");
    expect(intoIcon).toMatchObject({ ok: false, refusal: "content-not-admitted" });
  });
});

describe("правка узла", () => {
  it("заменяет названное поле целиком и не трогает остальные", () => {
    const first = grown(updateNode(base, "one", { props: { children: "Да" } }));
    const second = grown(updateNode(first, "one", { styles: { root: "видный" } }));

    expect(nodeOf(second, "one")).toMatchObject({
      props: { children: "Да" },
      styles: { root: "видный" },
      children: ["mark"],
      parentId: "page",
    });
  });

  it("названное поле со значением `undefined` — это снятие", () => {
    const withProps = grown(updateNode(base, "one", { props: { children: "Да" } }));
    const cleared = grown(updateNode(withProps, "one", { props: undefined }));

    expect(nodeOf(cleared, "one")?.props).toBeUndefined();
  });

  it("несуществующий узел — отказ", () => {
    expect(updateNode(base, "нет", { props: {} })).toMatchObject({ refusal: "node-unknown" });
  });
});
