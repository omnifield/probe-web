import { createRegistry, RenderTree, updateNode, type AssemblyTree, type ReadableComponent, type Registry } from "@omnifield/probe-web-assembly";
import { admits, baseAssemblyOf } from "@omnifield/probe-web-skin/editor";
import type { PassportAssembly, PassportEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { createTreeCollection, kit as treeViewKit } from "../src/tree-view/components/index.jsx";
import type { Data } from "../src/tree-view/entity/io.js";
import { passport as treeViewPassport } from "../src/tree-view/entity/passport.js";
import { assemblies } from "../src/tree-view/playground/assemblies/index.js";
import { editorInfo as treeViewEditorInfo } from "../src/tree-view/playground/index.js";

function readable<Part extends string, EditorData = unknown>(
  passport: ComponentPassport<Part>,
  editorInfo: PassportEditorInfo<Part, string, EditorData>,
): ReadableComponent["passport"] {
  return {
    component: passport.component,
    genus: editorInfo.genus,
    anatomy: passport.anatomy,
    root: passport.root,
    parts: passport.parts.map((part) => ({
      name: part.name,
      accepts: editorInfo.parts[part.name]?.accepts,
    })),
  };
}

const REGISTRY: Registry = createRegistry({
  components: {
    "tree-view": {
      passport: readable(treeViewPassport, treeViewEditorInfo),
      parts: treeViewKit.parts,
      extras: treeViewKit.extras,
    },
  },
  admits,
});

let dispose: (() => void) | undefined;
afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

// Ровно то, что делает `component-list.tsx`: `defaultExpandedValue` = все id групп сразу.
function mount(assembly: PassportAssembly, data: Data, defaultExpandedValue: string[]): HTMLElement {
  const rootNode = { id: "ROOT", name: "", children: data.items };
  const collection = createTreeCollection({
    nodeToValue: (node: { id: string }) => node.id,
    nodeToString: (node: { label?: string; name?: string }) => node.label ?? node.name ?? "",
    rootNode,
  });

  const base = baseAssemblyOf(treeViewPassport, assembly, "tree-view", data);
  const onRoot = updateNode(base as AssemblyTree, base.components.root, {
    props: { collection, defaultExpandedValue },
  });
  if (!onRoot.ok) throw new Error(`repro: rejected — ${onRoot.means}`);

  const host = document.createElement("div");
  document.body.append(host);
  dispose = render(() => <RenderTree registry={REGISTRY} tree={onRoot.tree} data={data} />, host);
  return host;
}

describe("repro: branch that starts OPEN (defaultExpandedValue) — does one click CLOSE it?", () => {
  it("open -> closed after ONE click", async () => {
    const assembly = assemblies.find((candidate) => candidate.name === "nested")!;
    const data: Data = {
      items: [{ id: "g1", label: "Group 1", children: [{ id: "a", label: "Alpha" }] }],
    };

    const host = mount(assembly as PassportAssembly, data, ["g1"]);

    const branch = host.querySelector('[data-scope="tree-view"][data-part="branch"]')!;
    const control = host.querySelector('[data-scope="tree-view"][data-part="branch-control"]')! as HTMLElement;

    expect(branch.getAttribute("data-state")).toBe("open");

    control.click();
    await Promise.resolve();

    console.log("AFTER ONE click on an initially-OPEN branch:", branch.getAttribute("data-state"));

    expect(branch.getAttribute("data-state")).toBe("closed");
  });
});
