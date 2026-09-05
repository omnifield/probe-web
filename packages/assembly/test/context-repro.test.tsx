// Проба PWEB-214: точка разрыва Solid-контекста в RenderNode. Диагностический инструмент —
// изолирует подозреваемых по одному: голая вложенность, <For>, <ErrorBoundary>, <Dynamic>
// (форма ark.div), и наконец РЕАЛЬНЫЙ RenderTree/RenderNode/registry с настоящим
// createContext/useContext на двух уровнях дерева (root -> child), тем же способом, каким
// заявка PWEB-214 предлагала репро с самого начала.

import { createComponent, Dynamic } from "solid-js/web";
import { createContext, createEffect, ErrorBoundary, For, useContext, type JSX } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { createRegistry, type AssemblyTree, type Registry } from "../src/index.js";
import { RenderTree } from "../src/render/index.jsx";

const Ctx = createContext<string>();

const Provider = (props: { children?: JSX.Element }) => (
  <Ctx.Provider value="from-root">{props.children}</Ctx.Provider>
);

const Reader = (props: { children?: JSX.Element }) => {
  const value = useContext(Ctx);
  if (value === undefined) throw new Error("ContextError: useContext returned undefined");
  return (
    <span data-testid="reader">
      {value}
      {props.children}
    </span>
  );
};

let dispose: (() => void) | undefined;
afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

const mount = (ui: () => JSX.Element) => {
  const host = document.createElement("div");
  document.body.append(host);
  dispose = render(ui, host);
  return host;
};

describe("PWEB-214 — где рвётся owner-цепочка", () => {
  it("A: голый createComponent + get children — контрольная группа, должно работать", () => {
    const host = mount(() =>
      createComponent(Provider, {
        get children() {
          return createComponent(Reader, {});
        },
      }),
    );
    expect(host.querySelector('[data-testid="reader"]')?.textContent).toBe("from-root");
  });

  it("B: children обёрнут в <For each={[x]}> — подозреваемый №1", () => {
    const host = mount(() =>
      createComponent(Provider, {
        get children() {
          return <For each={[0]}>{() => createComponent(Reader, {})}</For>;
        },
      }),
    );
    expect(host.querySelector('[data-testid="reader"]')?.textContent).toBe("from-root");
  });

  it("C: children обёрнут в <ErrorBoundary> — подозреваемый №2", () => {
    const host = mount(() =>
      createComponent(Provider, {
        get children() {
          return (
            <ErrorBoundary fallback={(e) => <span data-testid="error">{String(e)}</span>}>
              {createComponent(Reader, {})}
            </ErrorBoundary>
          );
        },
      }),
    );
    expect(host.querySelector('[data-testid="reader"]')?.textContent).toBe("from-root");
  });

  it("D: ErrorBoundary + For вместе — форма RenderNode буква в букву", () => {
    const host = mount(() =>
      createComponent(Provider, {
        get children() {
          return (
            <ErrorBoundary fallback={(e) => <span data-testid="error">{String(e)}</span>}>
              <For each={[0]}>{() => createComponent(Reader, {})}</For>
            </ErrorBoundary>
          );
        },
      }),
    );
    expect(host.querySelector('[data-testid="reader"]')?.textContent).toBe("from-root");
  });

  it('E: <Dynamic component="div"> между Provider и Reader — форма ark.div (factory.tsx)', () => {
    const host = mount(() =>
      createComponent(Provider, {
        get children() {
          return <Dynamic component="div">{createComponent(Reader, {})}</Dynamic>;
        },
      }),
    );
    expect(host.querySelector('[data-testid="reader"]')?.textContent).toBe("from-root");
  });

  it("F: РЕАЛЬНЫЙ RenderTree/RenderNode/registry, root -> child, настоящий createContext", () => {
    const REGISTRY: Registry = createRegistry({
      components: {
        widget: {
          passport: {
            component: "widget",
            genus: "component",
            anatomy: { keys: () => ["root", "child"] },
            root: "root",
            parts: [{ name: "root" }, { name: "child" }],
          },
          parts: { root: Provider, child: Reader },
        },
      },
      admits: () => true,
    });

    const TREE: AssemblyTree = {
      components: {
        root: "root",
        nodes: {
          root: {
            id: "root",
            type: "widget",
            parentId: null,
            children: ["child", "child-2"],
            props: { items: [{ id: "a" }, { id: "b" }] },
          },
          child: {
            id: "child",
            type: "widget.child",
            parentId: "root",
            children: ["grandchild"],
            props: { indexPath: [0] },
            bind: { node: "/items/0" },
          },
          grandchild: {
            id: "grandchild",
            type: "widget.child",
            parentId: "child",
            children: ["greatgrandchild"],
            on: { click: { event: { name: "click", context: {} } } },
          },
          greatgrandchild: {
            id: "greatgrandchild",
            type: "widget.child",
            parentId: "grandchild",
            children: [],
          },
          "child-2": {
            id: "child-2",
            type: "widget.child",
            parentId: "root",
            children: [],
            props: { indexPath: [1] },
            bind: { node: "/items/1" },
          },
        },
      },
    };

    const errors: unknown[] = [];
    const host = mount(() => (
      <RenderTree
        registry={REGISTRY}
        tree={TREE}
        errorFallback={(props) => {
          createEffect(() => errors.push(props.error));
          return null;
        }}
      />
    ));

    expect(errors).toEqual([]);
    expect(host.querySelectorAll('[data-testid="reader"]')).toHaveLength(4);
  });
});
