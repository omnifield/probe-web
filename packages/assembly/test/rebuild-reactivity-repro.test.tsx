// Регрессия — заявка user'а (2026-09-06): дерево, пересобираемое заново на каждую смену data
// (новый объект `AssemblyTree`, те же id узлов — как делает `instanceOf` у кита), теряло
// реактивность байндинга начиная со ВТОРОЙ пересборки. Первая смена данных доезжала, вторая и
// все последующие — нет, DOM замирал на значении после первой пересборки. Голый `RenderTree`,
// без кита и без Renderer продукта.
//
// Причина — не в диффинге дерева, а в РУЧНОМ ленивом синглтоне `contentCache.memo` в `RenderNode`
// (`if (!contentCache.memo) { contentCache.memo = createMemo(...) }`): единственное место в файле,
// где мемо заводится НЕ сразу при настройке компонента, как все остальные (`resolved`,
// `signature`, `assembled`…), а по требованию изнутри обычной функции. Починка — `contentOf` сам
// стал обычным `createMemo`, без обёртки и без ленивого гварда.

import { createMemo, createSignal } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { createRegistry, type AssemblyTree, type Registry } from "../src/index.js";
import { RenderTree } from "../src/render/index.jsx";

const Root = (props: { children?: unknown }) => <div data-testid="root">{props.children as never}</div>;

const REGISTRY: Registry = createRegistry({
  components: {
    widget: {
      passport: {
        component: "widget",
        genus: "component",
        anatomy: { keys: () => ["root"] },
        root: "root",
        parts: [{ name: "root", accepts: [{ kind: "content", genus: "text" }] }],
      },
      parts: { root: Root },
    },
  },
  admits: () => true,
});

function buildTree(): AssemblyTree {
  return {
    components: {
      root: "root",
      nodes: {
        root: { id: "root", type: "widget", parentId: null, children: ["label"] },
        label: { id: "label", genus: "text", value: { path: "/label" }, parentId: "root", children: [] },
      },
    },
  };
}

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe("RenderTree — дерево пересобирается заново на каждую смену data", () => {
  it("байндинг доезжает и на первой, и на второй, и на любой следующей пересборке", () => {
    const [data, setData] = createSignal<unknown>({ label: "первый" });
    const tree = createMemo(() => {
      data();
      return buildTree();
    });

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree()} data={data()} />, host);

    const root = () => host.querySelector('[data-testid="root"]');
    expect(root()?.textContent).toBe("первый");

    setData({ label: "второй" });
    expect(root()?.textContent).toBe("второй");

    setData({ label: "третий" });
    expect(root()?.textContent).toBe("третий");
  });
});
