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
// детей позже, — просто никогда не создаётся.
//
// ПЕРВАЯ версия фикса (коммит 4b5ce9a) заменила критерий целиком на `takesContent(registry,
// type)` — СТРУКТУРНОЕ свойство (может ли часть вообще принимать контент). Чинила select, но
// ломала реальный кит: `field`'s `requiredIndicator`/`table`'s заголовки — части, которые ПО
// РЕЕСТРУ принимают контент, но у конкретного узла нет ни одного ребёнка НИКОГДА (не `repeat`,
// просто по условию — необязательное поле, невключённая сортировка), раньше получали `null`
// (Ark-паттерн `props.children ?? "*"` срабатывал), стали получать пустой truthy `<For>` (дефолт
// молча не срабатывает). Найдено architect'ом ревью (`pnpm --filter @web-core/ui test`,
// 270/275) — см. `content-of-null-vs-for-breaks-ark-native-defaults` в ROADMAP.yaml.
//
// ИТОГОВЫЙ фикс — ДВА критерия разом, не один: `takesContent` решает, строить ли `<For>` ВООБЩЕ
// (закрытые по реестру части как получали `null`, так и получают); `children.length === 0`,
// проверяемый РЕАКТИВНО (внутри тела `createMemo`, не при первом чтении снаружи) — решает,
// отдавать ли его на ЭТОМ проходе. Часть, всегда пустая, — стабильный `null`. Часть, пустая
// СЕЙЧАС но получающая детей позже (`repeat`), — `null`→`<For>` по мере прихода данных, не
// кэшируется навсегда. Разбор — `src/render/index.tsx`'s докблок над `contentOf`, FAQ.md.
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
// Как `field`'s `requiredIndicator` — ПО РЕЕСТРУ принимает контент, но у конкретного узла нет
// ни одного ребёнка НИКОГДА (не `repeat`, просто условие не сработало) — Ark-паттерн
// `props.children ?? "*"` обязан сработать так же, как у `Closed`, несмотря на другой критерий.
const OpenButEmpty = (props: { children?: unknown }) => (
  <div data-testid="open-but-empty">{(props.children as never) ?? "дефолт"}</div>
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
    // "openButEmpty" структурно ПРИНИМАЕТ контент (takesContent=true, как field/table), но узел
    // ниже объявлен без единого ребёнка — не временно, навсегда.
    openButEmpty: {
      passport: {
        component: "openButEmpty",
        genus: "component",
        anatomy: { keys: () => ["root"] },
        root: "root",
        parts: [openPart("root")],
      },
      parts: { root: OpenButEmpty },
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

function openButEmptyTree(): AssemblyTree {
  return {
    components: {
      root: "root",
      nodes: { root: { id: "root", type: "openButEmpty", parentId: null, children: [] } },
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

  it("часть, ПРИНИМАЮЩАЯ контент по реестру, но реально без детей НИКОГДА (как field's requiredIndicator) — тоже null, не пустой truthy <For>", () => {
    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <RenderTree registry={REGISTRY} tree={openButEmptyTree()} />, host);

    expect(host.querySelector('[data-testid="open-but-empty"]')?.textContent).toBe("дефолт");
  });
});
