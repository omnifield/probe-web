// Live proof for a real gap named live: `growAll`'s `recur` recursion had no depth counter and no
// cycle detection — a self-recursing node with no exit in the data, or `repeat`-bound data that
// circles back on itself (a node's own descendant array happening to include an ancestor),
// recurses with no other exit condition. Both used to read as a raw `RangeError: Maximum call
// stack size exceeded`, not an engine error.
//
// Fix: a depth counter threaded through `grow`/`growAll`'s mutual recursion, throwing a named
// error well before the real native stack limit. This does not replace `repeat`'s own "not an
// array" exit — it is the backstop for the two paths that exit has never covered.

import { createAnatomy } from "@zag-js/anatomy";
import { describe, expect, it } from "vitest";

import { baseAssemblyOf, type BaseAssemblyElement } from "../src/engine/passport/assembly/index.js";
import { definePassport } from "../src/engine/passport/form/index.js";

const anatomy = createAnatomy("tree").parts("root", "node", "slot");

const passport = definePassport({
  anatomy,
  root: "root",
  parts: [{ name: "root", states: [] }, { name: "node", states: [] }, { name: "slot", states: [] }],
  variantAxis: { mark: { kind: "attribute", name: "data-variant" } },
  settings: {},
});

// The arbitrary-depth-tree pattern (kit README's FAQ) — a self-recursing node whose own `recur`
// attaches back into its own declared `slot`, so the SAME small schema unfolds to whatever depth
// the data actually has.
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
} as const;

describe("growAll — depth guard on recur/repeat recursion", () => {
  it("a self-recursing node with no exit in the data throws a named engine error, not a raw stack overflow", () => {
    // `recur.path` is ABSOLUTE ("/items") on purpose — it resolves to the exact same array on
    // every single recursive step, regardless of depth, so nothing ever runs out: the schema
    // itself, not just the data, is the thing with no exit here.
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

    const names = Object.values(grown.components.nodes)
      .filter((node): node is BaseAssemblyElement => "type" in node && node.type === "tree.node")
      .map((node) => node.bind?.["label"]);

    expect(names).toEqual(["/items/0/name", "/items/0/children/0/name", "/items/0/children/0/children/0/name"]);
  });
});
