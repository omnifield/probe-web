// Проба `RenderTree.rootProps` (PWEB — подсветка активного элемента в `component-list`, found
// 2026-09-03): динамическое состояние показа (какой элемент сейчас активен) — это НЕ структура
// дерева, тем же доводом, каким `data`/`dispatch` уже вынесены отдельным входом («Вид не
// приписывается узлу»). Смена такого значения обязана доезжать до живых пропов корня, не трогая
// дерево (`instanceOf`/`updateNode`) — иначе КАЖДЫЙ клик пересобирал бы всё дерево целиком, что
// и было настоящим багом (тривью в `apps/skin` дёргалось и роняло раскрытые узлы на скролле).

import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { createRegistry, RenderTree, type AssemblyTree, type Registry } from "../src/index.js";

let contentMounts = 0;

const Root = (props: { activeValue?: string; children?: unknown }) => (
  <div data-testid="root" data-active={props.activeValue}>
    {props.children as never}
  </div>
);

/** Считает собственные монтажи — тело компонента Solid выполняется РОВНО один раз на монтаж, так
 *  что счётчик — прямое доказательство того, пересобрался узел или нет. */
const Content = () => {
  contentMounts += 1;
  return <span data-testid="content">content</span>;
};

const REGISTRY: Registry = createRegistry({
  components: {
    widget: {
      passport: {
        component: "widget",
        genus: "component",
        anatomy: { keys: () => ["root", "content"] },
        root: "root",
        parts: [{ name: "root" }, { name: "content" }],
      },
      parts: { root: Root, content: Content },
    },
  },
  admits: () => true,
});

const TREE: AssemblyTree = {
  components: {
    root: "root",
    nodes: {
      root: { id: "root", type: "widget", parentId: null, children: ["content"] },
      content: { id: "content", type: "widget.content", parentId: "root", children: [] },
    },
  },
};

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
  contentMounts = 0;
});

describe("RenderTree rootProps — динамическое состояние показа доезжает до корня, дерево не трогает", () => {
  it("смена rootProps меняет живой проп корня; ребёнок не пересоздаётся", async () => {
    const [activeValue, setActiveValue] = createSignal<string | undefined>("a");

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(
      () => <RenderTree registry={REGISTRY} tree={TREE} rootProps={{ activeValue: activeValue() }} />,
      host,
    );

    expect(host.querySelector('[data-testid="root"]')?.getAttribute("data-active")).toBe("a");
    expect(contentMounts).toBe(1);

    setActiveValue("b");
    await Promise.resolve();

    expect(host.querySelector('[data-testid="root"]')?.getAttribute("data-active")).toBe("b");
    expect(contentMounts).toBe(1);
  });

  it("rootProps не задан — дерево рисуется как раньше, регрессии нет", () => {
    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <RenderTree registry={REGISTRY} tree={TREE} />, host);

    expect(host.querySelector('[data-testid="root"]')?.getAttribute("data-active")).toBeNull();
    expect(contentMounts).toBe(1);
  });
});
