// Live proof for both of the tree view's real assemblies (`../playground/assemblies/`) — one
// block each, same reason `accordion.test.tsx` splits its own two: different shape, different way
// to break.
//
// Both rely on `indexPathBind` (`PassportAssemblyElement.indexPathBind`, `packages/skin`) — the
// accumulated repeat index, written in as a literal `props` value, never a `bind` path (a
// structural fact of the tree's shape, not a fact of data). `branch`/`item` carry it (and
// `repeat`/`bind`) directly on themselves — `TreeViewBranch`/`TreeViewItem` (`components/kit.tsx`)
// wrap themselves in `TreeViewNodeProvider`, reading `node`/`indexPath` off their own props;
// nothing addresses `~nodeProvider` as a separate schema node anymore (постановка user,
// 2026-09-01, README «Разбор боем: `nodeProvider` НЕ нужен был как `extra` вообще»).

import { createRegistry, RenderTree, updateNode, type AssemblyTree, type DispatchedEvent, type ReadableComponent, type Registry } from "@omnifield/probe-web-assembly";
import { admits, baseAssemblyOf } from "@omnifield/probe-web-skin/editor";
import type { PassportAssembly, PassportEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { createTreeCollection, kit as treeViewKit } from "../components/index.jsx";
import type { Data } from "../entity/io.js";
import { passport as treeViewPassport } from "../entity/passport.js";
import { assemblies } from "../playground/assemblies/index.js";
import { editorInfo as treeViewEditorInfo } from "../playground/index.js";

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

/** `collection` — a real object, never `bind`-able — merged onto the root the same way `instanceOf`'s own `rootProps` would (`products/skin`). */
function mount(assembly: PassportAssembly, data: Data, dispatch?: (event: DispatchedEvent) => void): HTMLElement {
  const rootNode = { id: "ROOT", name: "", children: data.items };
  const collection = createTreeCollection({
    nodeToValue: (node: { id: string }) => node.id,
    nodeToString: (node: { label?: string; name?: string }) => node.label ?? node.name ?? "",
    rootNode,
  });

  const base = baseAssemblyOf(treeViewPassport, assembly, "tree-view", data);
  const onRoot = updateNode(base as AssemblyTree, base.components.root, { props: { collection } });
  if (!onRoot.ok) throw new Error(`витрина: экземпляр отвергнут механикой — ${onRoot.means}`);

  const host = document.createElement("div");
  document.body.append(host);
  dispose = render(() => <RenderTree registry={REGISTRY} tree={onRoot.tree} data={data} dispatch={dispatch} />, host);
  return host;
}

describe('tree view "base" — one level, every leaf labeled and clickable, click dispatches', () => {
  it("labels each item from data and dispatches triggerClick with the whole item as payload", async () => {
    const assembly = assemblies.find((candidate) => candidate.name === "base")!;
    const data: Data = { items: [{ id: "a", label: "Alpha" }, { id: "b", label: "Beta" }] };

    const dispatched: DispatchedEvent[] = [];
    // `baseAssemblyOf` is a plain runtime tree walker — it never reads `Data`, only resolves
    // paths against whatever `data` it is handed at call time, so widening here is correct (same
    // reasoning as `accordion.test.tsx`'s own identical cast).
    const host = mount(assembly as PassportAssembly, data, (event) => dispatched.push(event));

    const texts = [...host.querySelectorAll('[data-scope="tree-view"][data-part="item-text"]')].map(
      (node) => node.textContent,
    );
    expect(texts).toEqual(["Alpha", "Beta"]);

    // `data-depth` — Ark's OWN attribute, set from the REAL `indexPath` the assembly handed
    // `~nodeProvider` — not this test's own count, proof the value actually reached Zag's machine.
    const items = [...host.querySelectorAll('[data-scope="tree-view"][data-part="item"]')];
    expect(items.map((el) => el.getAttribute("data-depth"))).toEqual(["1", "1"]);

    // `on.click` composes with Ark's OWN click handling (selection), same device proven on
    // accordion's `itemTrigger`/listbox's `item` (`README.md`'s "Сборка ссылается на чужой
    // компонент") — clicking still selects the leaf natively AND fires our own dispatch.
    (items[1] as HTMLElement).click();
    await Promise.resolve();

    expect(dispatched).toEqual([
      expect.objectContaining({ name: "triggerClick", context: { payload: data.items[1] } }),
    ]);
    expect(items[1]!.getAttribute("data-selected")).toBe("");
  });
});

describe('tree view "nested" — top level always a branch, its children always items', () => {
  it("shows branch labels, expands to real item children, both levels correctly depth-marked", () => {
    const assembly = assemblies.find((candidate) => candidate.name === "nested")!;
    const data: Data = {
      items: [
        { id: "g1", label: "Group 1", children: [{ id: "a", label: "Alpha" }, { id: "b", label: "Beta" }] },
        { id: "g2", label: "Group 2", children: [{ id: "c", label: "Gamma" }] },
      ],
    };

    // `baseAssemblyOf` is a plain runtime tree walker — it never reads `Data`, only resolves
    // paths against whatever `data` it is handed at call time, so widening here is correct (same
    // reasoning as `accordion.test.tsx`'s own identical cast).
    const host = mount(assembly as PassportAssembly, data);

    const branchTexts = [...host.querySelectorAll('[data-scope="tree-view"][data-part="branch-text"]')].map(
      (node) => node.textContent,
    );
    const itemTexts = [...host.querySelectorAll('[data-scope="tree-view"][data-part="item-text"]')].map(
      (node) => node.textContent,
    );

    expect(branchTexts).toEqual(["Group 1", "Group 2"]);
    expect(itemTexts).toEqual(["Alpha", "Beta", "Gamma"]);

    const branches = [...host.querySelectorAll('[data-scope="tree-view"][data-part="branch"]')];
    const items = [...host.querySelectorAll('[data-scope="tree-view"][data-part="item"]')];
    expect(branches.map((el) => el.getAttribute("data-depth"))).toEqual(["1", "1"]);
    expect(items.map((el) => el.getAttribute("data-depth"))).toEqual(["2", "2", "2"]);
  });
});
