// Проба expand.ts (baseAssemblyOf/scopedPath) — переезд из packages/skin (см. лог
// packages/assembly/ROADMAP.yaml, "repeat-grow-lives-in-wrong-package"): та же механика, тот же
// набор сценариев, но `GrowablePassport` вместо полного `ComponentPassport` — этой функции
// никогда не был нужен весь паспорт, только `component`/`root`/`anatomy.keys()`
// (`baseAssemblyOf-passport-type-too-wide` сузил тип с `ReadablePassport` до этого среза —
// фикстура ниже нарочно НЕ несёт `genus`/`parts`, чтобы сужение проверялось не только типом, но и
// тем, что тест реально собирается без них).

import { describe, expect, it } from "vitest";

import {
  baseAssemblyOf,
  isContent,
  resolveDataBinding,
  scopedPath,
  type AssemblyElement,
  type GrowablePassport,
} from "../src/index.js";

function passportOf(component: string, root: string, parts: readonly string[]): GrowablePassport {
  return { component, root, anatomy: { keys: () => [...parts] } };
}

function elementsOf(tree: ReturnType<typeof baseAssemblyOf>, type: string): AssemblyElement[] {
  return Object.values(tree.components.nodes).filter(
    (node): node is AssemblyElement => !isContent(node) && node.type === type,
  );
}

describe("scopedPath", () => {
  it("empty path means the current scope as a whole", () => {
    expect(scopedPath("/rows/0", "")).toBe("/rows/0");
  });

  it("a leading slash is already absolute and ignores the scope", () => {
    expect(scopedPath("/rows/0", "/title")).toBe("/title");
  });

  it("otherwise the path is relative to the scope", () => {
    expect(scopedPath("/rows/0", "title")).toBe("/rows/0/title");
  });
});

describe("empty bind path inside a repeat", () => {
  it("resolves to the whole current element, not a field on it", () => {
    const passport = passportOf("list", "root", ["root", "row"]);
    const data = {
      rows: [
        { id: "a", label: "First" },
        { id: "b", label: "Second" },
      ],
    };

    const tree = baseAssemblyOf(
      passport,
      {
        name: "proof",
        means: "proof",
        tree: {
          node: "root",
          children: [
            {
              repeat: { path: "/rows" },
              template: { node: "row", bind: { value: "id", whole: "" } },
            },
          ],
        },
      },
      "list",
      data,
    );

    const rows = elementsOf(tree, "list.row");
    expect(rows).toHaveLength(2);

    expect(resolveDataBinding(data, rows[0]!.bind!["whole"]!)).toEqual({ id: "a", label: "First" });
    expect(resolveDataBinding(data, rows[1]!.bind!["whole"]!)).toEqual({ id: "b", label: "Second" });
  });
});

describe("repeat как поле, включая вложенный повтор", () => {
  const passport = passportOf("list", "root", ["root", "section", "row"]);
  const data = {
    sections: [
      { id: "s1", title: "First", rows: [{ id: "r1", title: "A" }, { id: "r2", title: "B" }] },
      { id: "s2", title: "Second", rows: [{ id: "r3", title: "C" }] },
    ],
  };

  it("grows one node per array element, and a nested repeat inside the template grows per its own array", () => {
    const tree = baseAssemblyOf(
      passport,
      {
        name: "proof",
        means: "proof",
        tree: {
          node: "root",
          children: [
            {
              node: "section",
              repeat: { path: "/sections" },
              bind: { title: "title" },
              children: [{ node: "row", repeat: { path: "rows" }, bind: { title: "title" } }],
            },
          ],
        },
      },
      "list",
      data,
    );

    const sections = elementsOf(tree, "list.section");
    const rows = elementsOf(tree, "list.row");

    expect(sections).toHaveLength(2);
    expect(rows).toHaveLength(3);
    expect(sections.map((section) => resolveDataBinding(data, section.bind!["title"]!))).toEqual(["First", "Second"]);
    expect(rows.map((row) => resolveDataBinding(data, row.bind!["title"]!))).toEqual(["A", "B", "C"]);
  });

  it("the older {repeat, template} wrapper keeps working, unchanged, next to the new field form", () => {
    const tree = baseAssemblyOf(
      passport,
      {
        name: "proof-wrapper",
        means: "proof",
        tree: {
          node: "root",
          children: [{ repeat: { path: "/sections" }, template: { node: "section", bind: { title: "title" } } }],
        },
      },
      "list",
      data,
    );

    const sections = elementsOf(tree, "list.section");
    expect(sections).toHaveLength(2);
    expect(sections.map((section) => resolveDataBinding(data, section.bind!["title"]!))).toEqual(["First", "Second"]);
  });
});

describe("growAll — depth guard on recur/repeat recursion", () => {
  const passport = passportOf("tree", "root", ["root", "node", "slot"]);

  // The arbitrary-depth-tree pattern — a self-recursing node whose own `recur` attaches back into
  // its own declared `slot`, so the SAME small schema unfolds to whatever depth the data has.
  const tree = {
    node: "root",
    children: [
      {
        node: "node",
        repeat: { path: "/items" },
        bind: { label: "name" },
        recur: { path: "children", into: "slot" },
        children: [{ node: "slot", children: [] }],
      },
    ],
  };

  it("a self-recursing node with no exit in the data throws a named engine error, not a raw stack overflow", () => {
    const looping = {
      node: "root",
      children: [
        {
          node: "node",
          repeat: { path: "/items" },
          bind: { label: "name" },
          recur: { path: "/items", into: "slot" },
          children: [{ node: "slot", children: [] }],
        },
      ],
    };

    expect(() =>
      baseAssemblyOf(passport, { name: "proof", means: "proof", tree: looping }, "tree", { items: [{ name: "n" }] }),
    ).toThrow(/grew past \d+ levels/);
  });

  it("data with a real cycle (a node's own children circling back to an ancestor) is caught the same way", () => {
    const ancestor: { name: string; children: unknown[] } = { name: "a", children: [] };
    const child = { name: "b", children: [ancestor] };
    ancestor.children.push(child);

    expect(() =>
      baseAssemblyOf(passport, { name: "proof", means: "proof", tree }, "tree", { items: [ancestor] }),
    ).toThrow(/grew past \d+ levels/);
  });

  it("a legitimate deep-but-finite self-recursion (the arbitrary-depth-tree pattern) still grows normally", () => {
    const deep = (depth: number): { name: string; children: unknown[] } => ({
      name: `n${depth}`,
      children: depth === 0 ? [] : [deep(depth - 1)],
    });

    const grown = baseAssemblyOf(passport, { name: "proof", means: "proof", tree }, "tree", { items: [deep(50)] });
    expect(Object.keys(grown.components.nodes).length).toBeGreaterThan(50);
  });

  it("each recursive level re-scopes fresh — a deeper node's bind reads ITS OWN data, not the first level's", () => {
    const grown = baseAssemblyOf(
      passport,
      { name: "proof", means: "proof", tree },
      "tree",
      { items: [{ name: "top", children: [{ name: "mid", children: [{ name: "bottom", children: [] }] }] }] },
    );

    const names = elementsOf(grown, "tree.node").map((node) => node.bind?.["label"]);
    expect(names).toEqual(["/items/0/name", "/items/0/children/0/name", "/items/0/children/0/children/0/name"]);
  });
});
