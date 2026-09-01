// Live proof for a real gap named live: a `ref` (`{ ref: "name" }`) sitting INSIDE a `repeat`
// lost scope entirely. `growAll`'s repeat branches call `scopeTemplate(template, base)` before
// recursing — that is what absolutizes `bind`/`repeat.path` — but the `isAssemblyRef` branch went
// straight to `growAll(mergeRef(template, node), parentId, indexPath)`, skipping `scopeTemplate`
// altogether: paths inside the referenced tree stayed exactly as authored in `refs`, as if the
// reference sat at the data root regardless of where it was actually used. A nested `repeat`
// inside the ref's own content resolved a path from the WRONG root, found nothing, and silently
// grew zero nodes — no error, just an empty branch.
//
// Fixture: "group → component" two levels, `component` reused via `ref` instead of written out at
// each of the two positions it would otherwise need repeating by hand — precisely the case that
// found this (a section → component → variant tree, per the report). A second describe block
// builds the SAME shape with the ref inlined by hand and asserts identical output — the parity
// check the report itself used to isolate the bug to `ref`, not to `repeat`/`indexPathBind`
// themselves (both already proven correct without `ref`, `repeat-field.test.ts`/`index-path.test.ts`).

import { createAnatomy } from "@zag-js/anatomy";
import { describe, expect, it } from "vitest";

import { baseAssemblyOf, resolveDataBinding, type BaseAssemblyElement } from "../src/passport/assembly/index.js";
import { definePassport } from "../src/passport/form/index.js";

const anatomy = createAnatomy("catalog").parts("root", "group", "component");

const passport = definePassport({
  anatomy,
  root: "root",
  parts: [{ name: "root", states: [] }, { name: "group", states: [] }, { name: "component", states: [] }],
  variantAxis: { mark: { kind: "attribute", name: "data-variant" } },
  settings: {},
});

const data = {
  groups: [
    { name: "Inputs", components: [{ name: "Field" }, { name: "Select" }] },
    { name: "Actions", components: [{ name: "Button" }] },
  ],
};

const isElement = (node: unknown): node is BaseAssemblyElement => typeof node === "object" && node !== null && "type" in node;

const componentsOf = (tree: ReturnType<typeof baseAssemblyOf>) =>
  Object.values(tree.components.nodes).filter((node) => isElement(node) && node.type === "catalog.component") as BaseAssemblyElement[];

describe("a ref inside a repeat carries the scope it was actually reached at", () => {
  it("resolves the ref's bind/repeat.path against the CURRENT element, not the data root", () => {
    const tree = baseAssemblyOf(
      passport,
      {
        name: "proof",
        means: "proof",
        tree: {
          node: "root",
          children: [
            {
              node: "group",
              repeat: { path: "/groups" },
              bind: { label: "name" },
              children: [{ ref: "component" }],
            },
          ],
        },
        refs: {
          // Written exactly as it would be at the data root — the whole point of a ref is that
          // its author does NOT know in advance where it will be used.
          component: { node: "component", repeat: { path: "components" }, bind: { label: "name" }, indexPathBind: "indexPath" },
        },
      },
      "catalog",
      data,
    );

    const components = componentsOf(tree);

    expect(components).toHaveLength(3);
    expect(components.map((component) => resolveDataBinding(data, component.bind!["label"]!))).toEqual([
      "Field",
      "Select",
      "Button",
    ]);
    expect(components.map((component) => component.props?.["indexPath"])).toEqual([[0, 0], [0, 1], [1, 0]]);
  });

  it("produces the IDENTICAL tree to the same shape written out by hand, without a ref", () => {
    const byHand = baseAssemblyOf(
      passport,
      {
        name: "proof",
        means: "proof",
        tree: {
          node: "root",
          children: [
            {
              node: "group",
              repeat: { path: "/groups" },
              bind: { label: "name" },
              children: [{ node: "component", repeat: { path: "components" }, bind: { label: "name" }, indexPathBind: "indexPath" }],
            },
          ],
        },
      },
      "catalog",
      data,
    );

    const throughRef = baseAssemblyOf(
      passport,
      {
        name: "proof",
        means: "proof",
        tree: { node: "root", children: [{ node: "group", repeat: { path: "/groups" }, bind: { label: "name" }, children: [{ ref: "component" }] }] },
        refs: { component: { node: "component", repeat: { path: "components" }, bind: { label: "name" }, indexPathBind: "indexPath" } },
      },
      "catalog",
      data,
    );

    const strip = (component: BaseAssemblyElement) => ({ bind: component.bind, props: component.props });
    expect(componentsOf(throughRef).map(strip)).toEqual(componentsOf(byHand).map(strip));
  });

  it("a ref at the ROOT (no enclosing repeat) still absolutizes against the empty base, not left dangling", () => {
    const tree = baseAssemblyOf(
      passport,
      {
        name: "proof",
        means: "proof",
        tree: { node: "root", children: [{ ref: "group" }] },
        refs: { group: { node: "group", bind: { label: "/groups/0/name" } } },
      },
      "catalog",
      data,
    );

    const group = Object.values(tree.components.nodes).find((node) => isElement(node) && node.type === "catalog.group") as BaseAssemblyElement;
    expect(resolveDataBinding(data, group.bind!["label"]!)).toBe("Inputs");
  });
});
