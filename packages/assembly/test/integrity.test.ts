// Целостность: каждый изъян назван своим именем, а целое дерево не даёт ложных.
//
// Проверяется ИМЯ отказа, а не то, что «что-то не так»: имя — это и есть контракт, по нему
// редактор объясняет человеку, а хранилище решает, брать ли дерево.

import { describe, expect, it } from "vitest";

import { checkTree } from "../src/integrity.js";
import type { AssemblyTree } from "../src/tree.js";

/** Имена изъянов дерева — в порядке появления. */
const flawsOf = (tree: AssemblyTree) => checkTree(tree).map((flaw) => flaw.flaw);

const whole: AssemblyTree = {
  components: {
    root: "page",
    nodes: {
      page: { id: "page", type: "layout", parentId: null, children: ["one"] },
      one: { id: "one", type: "button", parentId: "page", children: [] },
    },
  },
};

describe("целое дерево", () => {
  it("изъянов не даёт", () => {
    expect(checkTree(whole)).toEqual([]);
  });

  it("пустое дерево изъяном не считается — это законный первый кадр", () => {
    expect(checkTree({ components: { root: "", nodes: {} } })).toEqual([]);
  });
});

describe("изъяны", () => {
  it("корень назван, но его нет", () => {
    expect(
      flawsOf({ components: { root: "нет", nodes: whole.components.nodes } }),
    ).toContain("root-missing");
  });

  it("узел лежит под чужим ключом", () => {
    expect(
      flawsOf({
        components: {
          root: "page",
          nodes: {
            page: { id: "другой", type: "layout", parentId: null, children: [] },
          },
        },
      }),
    ).toContain("id-mismatch");
  });

  it("ссылка на несуществующего ребёнка", () => {
    expect(
      flawsOf({
        components: {
          root: "page",
          nodes: { page: { id: "page", type: "layout", parentId: null, children: ["призрак"] } },
        },
      }),
    ).toContain("child-missing");
  });

  it("один ребёнок назван дважды", () => {
    expect(
      flawsOf({
        components: {
          root: "page",
          nodes: {
            page: { id: "page", type: "layout", parentId: null, children: ["one", "one"] },
            one: { id: "one", type: "button", parentId: "page", children: [] },
          },
        },
      }),
    ).toContain("child-duplicated");
  });

  it("обратная ссылка не совпадает с прямой", () => {
    expect(
      flawsOf({
        components: {
          root: "page",
          nodes: {
            page: { id: "page", type: "layout", parentId: null, children: ["one"] },
            one: { id: "one", type: "button", parentId: "кто-то", children: [] },
          },
        },
      }),
    ).toContain("parent-mismatch");
  });

  it("один узел числится ребёнком у двоих", () => {
    expect(
      flawsOf({
        components: {
          root: "page",
          nodes: {
            page: { id: "page", type: "layout", parentId: null, children: ["a", "b"] },
            a: { id: "a", type: "layout", parentId: "page", children: ["общий"] },
            b: { id: "b", type: "layout", parentId: "page", children: ["общий"] },
            общий: { id: "общий", type: "button", parentId: "a", children: [] },
          },
        },
      }),
    ).toContain("child-shared");
  });

  it("узел недостижим от корня", () => {
    expect(
      flawsOf({
        components: {
          root: "page",
          nodes: {
            page: { id: "page", type: "layout", parentId: null, children: [] },
            сирота: { id: "сирота", type: "button", parentId: null, children: [] },
          },
        },
      }),
    ).toContain("orphaned");
  });

  it("узел лежит в собственном поддереве — и обход всё равно завершается", () => {
    const looped: AssemblyTree = {
      components: {
        root: "page",
        nodes: {
          page: { id: "page", type: "layout", parentId: null, children: ["a"] },
          a: { id: "a", type: "layout", parentId: "page", children: ["b"] },
          b: { id: "b", type: "layout", parentId: "a", children: ["a"] },
        },
      },
    };

    expect(flawsOf(looped)).toContain("cycle");
  });

  it("называет ВСЕ изъяны сразу, а не первый", () => {
    const names = flawsOf({
      components: {
        root: "нет",
        nodes: {
          page: { id: "page", type: "layout", parentId: null, children: ["призрак"] },
        },
      },
    });

    expect(names).toContain("root-missing");
    expect(names).toContain("child-missing");
    expect(names).toContain("orphaned");
  });
});
