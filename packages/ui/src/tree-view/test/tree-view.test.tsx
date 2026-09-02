import { createRegistry, RenderTree, updateNode, type AssemblyTree, type DispatchedEvent, type ReadableComponent, type Registry } from "@omnifield/probe-web-assembly";
import { admits, baseAssemblyOf } from "@omnifield/probe-web-skin/editor";
import type { PassportAssembly, PassportEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { kit as treeViewKit } from "../components/index.jsx";
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

function mount(
  assembly: PassportAssembly,
  data: Data,
  dispatch?: (event: DispatchedEvent) => void,
  rootProps?: Readonly<Record<string, unknown>>,
): HTMLElement {
  const base = baseAssemblyOf(treeViewPassport, assembly, "tree-view", data);
  const onRoot = updateNode(base as AssemblyTree, base.components.root, {
    props: { items: data.items, ...rootProps },
  });
  if (!onRoot.ok) throw new Error(`витрина: экземпляр отвергнут механикой — ${onRoot.means}`);

  const host = document.createElement("div");
  document.body.append(host);
  dispose = render(() => <RenderTree registry={REGISTRY} tree={onRoot.tree} data={data} dispatch={dispatch} />, host);
  return host;
}

describe('tree view "base" — one level, every item labeled and clickable, click dispatches the whole item', () => {
  it("labels each item from data and dispatches controlClick with the whole item as payload", async () => {
    const assembly = assemblies.find((candidate) => candidate.name === "base")!;
    const data: Data = { items: [{ id: "a", label: "Alpha" }, { id: "b", label: "Beta" }] };

    const dispatched: DispatchedEvent[] = [];
    const host = mount(assembly as PassportAssembly, data, (event) => dispatched.push(event));

    const controls = [...host.querySelectorAll('[data-scope="tree-view"][data-part="control"]')];
    expect(controls.map((node) => node.textContent)).toEqual(["Alpha", "Beta"]);

    const items = [...host.querySelectorAll('[data-scope="tree-view"][data-part="item"]')];
    expect(items.map((el) => el.getAttribute("data-depth"))).toEqual(["1", "1"]);

    (controls[1] as HTMLElement).click();
    await Promise.resolve();

    expect(dispatched).toEqual([
      expect.objectContaining({ name: "controlClick", context: { payload: data.items[1] } }),
    ]);
    expect(items[1]!.getAttribute("data-selected")).toBe("");
    // Лист не заводит индикатор вовсе — даже активный, ему нечего раскрывать.
    expect(controls[1]!.querySelector('[data-part="control-indicator"]')).toBeNull();
    expect(controls[1]!.textContent).toBe("Beta");
  });
});

describe('tree view "base" — recur grows the same node again from its own data, depth from data alone', () => {
  it("labels and dispatches correctly three levels deep, off ONE small schema with no per-level node", async () => {
    const assembly = assemblies.find((candidate) => candidate.name === "base")!;
    const data: Data = {
      items: [
        {
          id: "a",
          label: "Alpha",
          children: [
            {
              id: "a1",
              label: "Alpha One",
              children: [{ id: "a1x", label: "Alpha One X" }],
            },
          ],
        },
      ],
    };

    const dispatched: DispatchedEvent[] = [];
    const host = mount(assembly as PassportAssembly, data, (event) => dispatched.push(event));

    const controls = [...host.querySelectorAll('[data-scope="tree-view"][data-part="control"]')];
    expect(controls.map((node) => node.textContent)).toEqual(["▶Alpha", "▶Alpha One", "Alpha One X"]);

    const items = [...host.querySelectorAll('[data-scope="tree-view"][data-part="item"]')];
    expect(items.map((el) => el.getAttribute("data-depth"))).toEqual(["1", "2", "3"]);

    (controls[2] as HTMLElement).click();
    await Promise.resolve();

    expect(dispatched).toEqual([
      expect.objectContaining({
        name: "controlClick",
        context: { payload: data.items[0]!.children![0]!.children![0] },
      }),
    ]);
  });

  it("stops on its own where the data stops — no children means no deeper nodes, not an error", () => {
    const assembly = assemblies.find((candidate) => candidate.name === "base")!;
    const data: Data = { items: [{ id: "a", label: "Alpha" }] };

    const host = mount(assembly as PassportAssembly, data);

    const items = [...host.querySelectorAll('[data-scope="tree-view"][data-part="item"]')];
    expect(items.map((el) => el.getAttribute("data-depth"))).toEqual(["1"]);
  });
});

describe('tree view "base" — externally driven activeValue overrides Zag\'s own click-driven selection', () => {
  it("highlights exactly the given id, and a real click elsewhere does not move it", async () => {
    const assembly = assemblies.find((candidate) => candidate.name === "base")!;
    const data: Data = { items: [{ id: "a", label: "Alpha" }, { id: "b", label: "Beta" }] };

    const host = mount(assembly as PassportAssembly, data, undefined, { activeValue: "a" });

    const items = [...host.querySelectorAll('[data-scope="tree-view"][data-part="item"]')];
    expect(items[0]!.getAttribute("data-selected")).toBe("");
    expect(items[1]!.getAttribute("data-selected")).toBeNull();

    const controls = [...host.querySelectorAll('[data-scope="tree-view"][data-part="control"]')];
    (controls[1] as HTMLElement).click();
    await Promise.resolve();

    // Клик по Beta — родной `selectNode` у Zag его бы выбрал, но снаружи задан "a", и он побеждает.
    expect(items[0]!.getAttribute("data-selected")).toBe("");
    expect(items[1]!.getAttribute("data-selected")).toBeNull();
  });

  it("without activeValue, native click-driven selection works exactly as before", async () => {
    const assembly = assemblies.find((candidate) => candidate.name === "base")!;
    const data: Data = { items: [{ id: "a", label: "Alpha" }, { id: "b", label: "Beta" }] };

    const host = mount(assembly as PassportAssembly, data);

    const controls = [...host.querySelectorAll('[data-scope="tree-view"][data-part="control"]')];
    (controls[1] as HTMLElement).click();
    await Promise.resolve();

    const items = [...host.querySelectorAll('[data-scope="tree-view"][data-part="item"]')];
    expect(items[1]!.getAttribute("data-selected")).toBe("");
  });
});
