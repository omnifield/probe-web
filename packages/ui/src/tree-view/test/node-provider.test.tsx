// PROOF: a per-node context provider (`TreeViewNodeProvider`) recursed across a real branch→item
// tree renders correctly through the EXISTING engine — no new capability in `packages/assembly`
// needed. Corrects an earlier, wrong claim (this component's `playground/assemblies.ts` used to
// say per-node providers were blocked on unbuilt render-path plumbing; that comment was checked
// against `render.tsx`'s ROOT-level `provider` mechanism — PWEB-153, one provider for the whole
// tree — and never actually tried against the `extras` mechanism instead).
//
// What actually makes this work, verified here, not assumed:
//   - `AssemblyElement.props` is `Record<string, unknown>` (`packages/assembly/src/tree.ts`) —
//     NOT JSON-restricted. Only `bind` is JSON-Pointer-only; a hand-built tree's `props` can hold
//     a real `TreeCollection` instance, a real node object, a real `indexPath` array.
//   - `TreeViewNodeProvider` (`@ark-ui/solid`) takes exactly `node`/`indexPath` as plain props
//     (`createSplitProps()(props, ["indexPath", "node"])`) and calls
//     `collection.getNodeValue(node)`/`collection.getValuePath(indexPath)` — structural, not
//     identity-based: a fresh plain object with the right shape works.
//   - `extras` (`tree-view.~nodeProvider`, `defineKitComponent`'s third argument) already resolves
//     through the registry (`packages/assembly/src/registry.ts`'s `readAddress`), and `RenderNode`
//     recurses into an extra's own `children` exactly like any other node — no special-casing
//     needed, none added.
//
// UPDATE (2026-09-01): the declarative `PassportAssembly` repeat/bind DSL now expresses this too —
// `indexPathBind` (`packages/skin`) closes exactly the gap this file's header used to name here,
// and the tree view's REAL, shipped assemblies (`playground/assemblies/base.ts`/`nested.ts`,
// proven in `test/tree-view.test.tsx`) use it, not the hand-built approach below. This file stays
// as a lower-level proof of the `extras` mechanism itself — useful on its own, no longer the only
// working path.

import { createRegistry, RenderTree, type AssemblyTree, type Registry } from "@omnifield/probe-web-assembly";
import { admits } from "@omnifield/probe-web-skin/editor";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { kit } from "../components/kit.jsx";
import { passport } from "../entity/passport.js";
import { createTreeCollection } from "../components/index.js";

let dispose: (() => void) | undefined;
afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

interface Node {
  id: string;
  name: string;
  children?: Node[];
}

/** A programmatic tree-builder — walks real hierarchical data, emits a real flat AssemblyTree.
 * This is what a real assembly for a recursive structure looks like: NOT the declarative
 * repeat/bind DSL (which cannot compute an incrementing indexPath), a real function instead. */
function buildTree(rootNode: Node, registryAddress: string, collection: unknown): AssemblyTree {
  const nodes: Record<string, unknown> = {};
  let n = 0;
  const nextId = () => `n${n++}`;

  function walk(node: Node, indexPath: number[]): string {
    const isBranch = (node.children?.length ?? 0) > 0;
    const providerId = nextId();
    const nodeId = nextId();
    const textId = nextId();
    const contentTextId = nextId();

    if (isBranch) {
      const childIds = node.children!.map((child, i) => walk(child, [...indexPath, i]));
      nodes[providerId] = {
        id: providerId,
        type: `${registryAddress}.~nodeProvider`,
        parentId: null,
        children: [nodeId],
        props: { node, indexPath },
      };
      nodes[nodeId] = { id: nodeId, type: `${registryAddress}.branch`, parentId: providerId, children: [textId, ...childIds.length ? [`content-${nodeId}`] : []], props: {} };
      nodes[textId] = { id: textId, type: `${registryAddress}.branchText`, parentId: nodeId, children: [contentTextId], props: {} };
      nodes[contentTextId] = { id: contentTextId, parentId: textId, children: [], genus: "text", value: node.name };
      const contentWrapId = `content-${nodeId}`;
      nodes[contentWrapId] = { id: contentWrapId, type: `${registryAddress}.branchContent`, parentId: nodeId, children: childIds, props: {} };
      return providerId;
    }

    nodes[providerId] = {
      id: providerId,
      type: `${registryAddress}.~nodeProvider`,
      parentId: null,
      children: [nodeId],
      props: { node, indexPath },
    };
    nodes[nodeId] = { id: nodeId, type: `${registryAddress}.item`, parentId: providerId, children: [textId], props: {} };
    nodes[textId] = { id: textId, type: `${registryAddress}.itemText`, parentId: nodeId, children: [contentTextId], props: {} };
    nodes[contentTextId] = { id: contentTextId, parentId: textId, children: [], genus: "text", value: node.name };
    return providerId;
  }

  const topIds = (rootNode.children ?? []).map((child, i) => walk(child, [i]));
  nodes["root"] = { id: "root", type: registryAddress, parentId: null, children: ["tree"], props: { collection } };
  nodes["tree"] = { id: "tree", type: `${registryAddress}.tree`, parentId: "root", children: topIds, props: {} };

  return { components: { root: "root", nodes } } as unknown as AssemblyTree;
}

describe("per-node context provider — recursive branch→item nesting, 3 levels deep", () => {
  it("renders group → component → variant via a programmatic tree-builder, no new engine capability", () => {
    const rootNode: Node = {
      id: "ROOT",
      name: "",
      children: [
        {
          id: "disclosure",
          name: "disclosure",
          children: [
            {
              id: "accordion",
              name: "accordion",
              children: [
                { id: "cards", name: "cards" },
                { id: "outline", name: "outline" },
              ],
            },
          ],
        },
      ],
    };

    const collection = createTreeCollection({
      nodeToValue: (node: Node) => node.id,
      nodeToString: (node: Node) => node.name,
      rootNode,
    });

    const REGISTRY: Registry = createRegistry({
      components: {
        "tree-view": {
          passport: {
            component: "tree-view",
            genus: "component",
            anatomy: passport.anatomy,
            root: passport.root,
            parts: passport.parts.map((part) => ({ name: part.name })),
          },
          parts: kit.parts,
          extras: kit.extras,
        },
      },
      admits,
    });

    const tree = buildTree(rootNode, "tree-view", collection);

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} />, host);

    const branchTexts = [...host.querySelectorAll('[data-scope="tree-view"][data-part="branch-text"]')].map(
      (node) => node.textContent,
    );
    const itemTexts = [...host.querySelectorAll('[data-scope="tree-view"][data-part="item-text"]')].map(
      (node) => node.textContent,
    );

    expect(branchTexts).toEqual(["disclosure", "accordion"]);
    expect(itemTexts).toEqual(["cards", "outline"]);

    // Depth actually resolves through Zag's own indexPath→collection walk, not just "renders
    // something" — this is the real proof the mechanism is not a coincidence.
    const items = [...host.querySelectorAll('[data-scope="tree-view"][data-part="item"]')];
    expect(items.map((el) => el.getAttribute("data-depth"))).toEqual(["3", "3"]);
  });
});
