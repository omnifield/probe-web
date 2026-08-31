// Live proof for PWEB-171: `repeat` as a field on the node itself (`part`/`component`), not a
// separate `{repeat, template}` wrapper — sitting right next to `bind`/`props`, matching user's
// sketch on Windshift page 112 §2. Nested repeat (an outer repeat whose per-instance template
// itself repeats) is the real shape the accordion+button case needs: sections, and inside each
// section, its own items.

import { createAnatomy } from "@zag-js/anatomy";
import { describe, expect, it } from "vitest";

import { baseAssemblyOf, resolveDataBinding, type BaseAssemblyElement } from "../src/passport/assembly/index.js";
import { definePassport } from "../src/passport/form/index.js";

const anatomy = createAnatomy("list").parts("root", "section", "row");

const passport = definePassport({
  anatomy,
  root: "root",
  parts: [{ name: "root", states: [] }, { name: "section", states: [] }, { name: "row", states: [] }],
  variantAxis: { mark: { kind: "attribute", name: "data-variant" } },
  settings: {},
});

const data = {
  sections: [
    { id: "s1", title: "First", rows: [{ id: "r1", title: "A" }, { id: "r2", title: "B" }] },
    { id: "s2", title: "Second", rows: [{ id: "r3", title: "C" }] },
  ],
};

describe("repeat as a field, including nested repeat (PWEB-171)", () => {
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
              children: [
                {
                  node: "row",
                  repeat: { path: "rows" },
                  bind: { title: "title" },
                },
              ],
            },
          ],
        },
      },
      "list",
      data,
    );

    const isElement = (node: unknown): node is BaseAssemblyElement =>
      typeof node === "object" && node !== null && "type" in node;

    const sections = Object.values(tree.components.nodes).filter(
      (node) => isElement(node) && node.type === "list.section",
    ) as BaseAssemblyElement[];
    const rows = Object.values(tree.components.nodes).filter(
      (node) => isElement(node) && node.type === "list.row",
    ) as BaseAssemblyElement[];

    expect(sections).toHaveLength(2);
    expect(rows).toHaveLength(3);

    expect(sections.map((section) => resolveDataBinding(data, section.bind!.title!))).toEqual([
      "First",
      "Second",
    ]);
    expect(rows.map((row) => resolveDataBinding(data, row.bind!.title!))).toEqual(["A", "B", "C"]);
  });

  it("the older {repeat, template} wrapper keeps working, unchanged, next to the new field form", () => {
    const tree = baseAssemblyOf(
      passport,
      {
        name: "proof-wrapper",
        means: "proof",
        tree: {
          node: "root",
          children: [
            {
              repeat: { path: "/sections" },
              template: { node: "section", bind: { title: "title" } },
            },
          ],
        },
      },
      "list",
      data,
    );

    const isElement = (node: unknown): node is BaseAssemblyElement =>
      typeof node === "object" && node !== null && "type" in node;
    const sections = Object.values(tree.components.nodes).filter(
      (node) => isElement(node) && node.type === "list.section",
    ) as BaseAssemblyElement[];

    expect(sections).toHaveLength(2);
    expect(sections.map((section) => resolveDataBinding(data, section.bind!.title!))).toEqual([
      "First",
      "Second",
    ]);
  });
});
