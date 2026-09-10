// Регрессия — заявка owner-skin-app (2026-09-10, `apps/skin/test/render-tree-repeat-reactivity.test.tsx`,
// `apps/skin/ROADMAP.yaml`'s `repeat-items-empty-on-embed`): переход 0 items → N items ПОСЛЕ
// монтирования подхватывался у `radio-group` (`item` — прямой потомок `root`), но НЕ у `select`
// (`item` — потомок `content`, вложенного в `positioner`).
//
// Причина — `RenderNode`'s `contentOf()` (`src/render/index.tsx`): решение null-vs-`<For>`
// принималось ОДИН РАЗ, на первом чтении, по `current.children.length === 0` — ДАННОМУ, не
// СТРУКТУРЕ. Если узел монтируется раньше, чем `repeat` успевает развернуть детей (данные ещё не
// приехали), `children.length` на этот момент — 0, решение «null» кэшируется НАВСЕГДА (кэш —
// ленивый синглтон, `if (!contentCache.memo)`), и `<For>` — единственный, кто мог бы подхватить
// детей позже, — просто никогда не создаётся. Голая структура ниже (без кита, без Ark) доказывает:
// дело не в глубине вложенности и не в Portal — оба варианта ловят баг ОДИНАКОВО при старой
// проверке (см. git-историю правки, `current.children.length === 0`).
//
// Починка: решение null-vs-`<For>` теперь смотрит на `takesContent(registry, type)` —
// СТРУКТУРНОЕ свойство адреса из реестра (может ли эта ЧАСТЬ компонента вообще принимать
// контент), не на то, сколько детей у НЕЁ есть ПРЯМО СЕЙЧАС. Живой select (`apps/skin`,
// `@web-core/ui`) проверен после пересборки `packages/assembly`: 0→2 item подхватывается.
import { createMemo, createSignal } from "solid-js";
import { Portal, render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { createRegistry, type AssemblyTree, type Registry } from "../src/index.js";
import { RenderTree } from "../src/render/index.jsx";

const Root = (props: { children?: unknown }) => <div data-testid="root">{props.children as never}</div>;
const Positioner = (props: { children?: unknown }) => (
  <Portal>
    <div data-testid="positioner">{props.children as never}</div>
  </Portal>
);
const Content = (props: { children?: unknown }) => (
  <div data-testid="content">{props.children as never}</div>
);
const Item = (props: { children?: unknown }) => <div data-testid="item">{props.children as never}</div>;
const Closed = (props: { children?: unknown }) => (
  <div data-testid="closed">{(props.children as never) ?? "дефолт"}</div>
);

function openPart(name: string) {
  return { name, accepts: [{ kind: "component" as const }] };
}

const REGISTRY: Registry = createRegistry({
  components: {
    flat: {
      passport: {
        component: "flat",
        genus: "component",
        anatomy: { keys: () => ["root"] },
        root: "root",
        parts: [openPart("root")],
      },
      parts: { root: Root },
    },
    item: {
      passport: {
        component: "item",
        genus: "component",
        anatomy: { keys: () => ["root"] },
        root: "root",
        parts: [openPart("root")],
      },
      parts: { root: Item },
    },
    // Один компонент "nested" с ТРЕМЯ частями — так реально устроен паспорт (`part("content")` —
    // часть "nested", адрес "nested.content", не отдельный компонент реестра).
    nested: {
      passport: {
        component: "nested",
        genus: "component",
        anatomy: { keys: () => ["root", "positioner", "content"] },
        root: "root",
        parts: [openPart("root"), openPart("positioner"), openPart("content")],
      },
      parts: { root: Root, positioner: Positioner, content: Content },
    },
    // "closed" структурно НЕ принимает контент (`accepts` не задан вовсе) — takesContent=false,
    // должен оставаться `null` (Ark-дефолт `props.children ?? "*"` обязан сработать), а не
    // превращаться в пустой truthy `<For>`.
    closed: {
      passport: {
        component: "closed",
        genus: "component",
        anatomy: { keys: () => ["root"] },
        root: "root",
        parts: [{ name: "root", accepts: [] }],
      },
      parts: { root: Closed },
    },
  },
  admits: () => true,
});

function flatTree(items: string[]): AssemblyTree {
  return {
    components: {
      root: "root",
      nodes: {
        root: { id: "root", type: "flat", parentId: null, children: items },
        ...Object.fromEntries(
          items.map((id) => [id, { id, type: "item", parentId: "root", children: [] }]),
        ),
      },
    },
  };
}

function nestedTree(items: string[]): AssemblyTree {
  return {
    components: {
      root: "root",
      nodes: {
        root: { id: "root", type: "nested", parentId: null, children: ["positioner"] },
        positioner: { id: "positioner", type: "nested.positioner", parentId: "root", children: ["content"] },
        content: { id: "content", type: "nested.content", parentId: "positioner", children: items },
        ...Object.fromEntries(
          items.map((id) => [id, { id, type: "item", parentId: "content", children: [] }]),
        ),
      },
    },
  };
}

function closedTree(): AssemblyTree {
  return {
    components: {
      root: "root",
      nodes: { root: { id: "root", type: "closed", parentId: null, children: [] } },
    },
  };
}

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe("RenderNode.contentOf — null-vs-<For> по takesContent, не по children.length на первом чтении", () => {
  it("плоский случай (item — прямой потомок root): 0→N подхватывается", () => {
    const [items, setItems] = createSignal<string[]>([]);
    const tree = createMemo(() => flatTree(items()));

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree()} />, host);

    expect(host.querySelectorAll('[data-testid="item"]')).toHaveLength(0);
    setItems(["a", "b", "c"]);
    expect(host.querySelectorAll('[data-testid="item"]')).toHaveLength(3);
  });

  it("вложенный случай (item — потомок content внутри positioner, тот — в Portal): 0→N подхватывается", () => {
    const [items, setItems] = createSignal<string[]>([]);
    const tree = createMemo(() => nestedTree(items()));

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree()} />, host);

    expect(document.body.querySelectorAll('[data-testid="content"]')).toHaveLength(1);
    expect(document.body.querySelectorAll('[data-testid="item"]')).toHaveLength(0);
    setItems(["a", "b", "c"]);
    expect(document.body.querySelectorAll('[data-testid="item"]')).toHaveLength(3);
  });

  it("часть, структурно не принимающая контент (takesContent=false), остаётся null — Ark-дефолт срабатывает", () => {
    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <RenderTree registry={REGISTRY} tree={closedTree()} />, host);

    expect(host.querySelector('[data-testid="closed"]')?.textContent).toBe("дефолт");
  });
});
