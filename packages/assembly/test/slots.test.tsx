// Первая прямая проба движка (`packages/assembly` не имел ни одного своего теста, README прямо
// это называет) — доказательство `slots` (`PWEB-176`, разбор и решение — тикет `PWEB-174`).
//
// Реестр здесь — СВОИ, синтетические компоненты, не кит: предмет пробы — механика `RenderTree`
// (`contentOf()`), а не разметка какого-то конкретного компонента. Дерево собрано литералом
// (тем же приёмом, что `packages/ui/src/button/button.test.tsx`'s синтетические узлы-ссылки),
// не через `baseAssemblyOf` — сборке слот не нужен, только вход `RenderTree.slots`.

import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import {
  createRegistry,
  RenderTree,
  type AssemblyTree,
  type Registry,
} from "../src/index.js";

/**
 * Компонент-обёртка: рисует то, что ему передали содержимым, плюс метку в `data-testid` — по
 * ней проба видит, что резолв РЕАЛЬНО дошёл до реестра, а не был обойдён слотом (ровно та
 * ошибка, что нашлась в черновике роадмапа: слот НИКОГДА не подменяет сам узел).
 */
const Wrapper = (props: { children?: unknown; "data-static"?: string; variant?: string }) => (
  <div data-testid="wrapper" data-static={props["data-static"]} data-variant={props.variant}>
    {props.children as never}
  </div>
);

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
      parts: { root: Wrapper, content: Wrapper },
    },
  },
  admits: () => true,
});

/** Дерево: корень — обёртка, единственный ребёнок — узел `widget.content`, куда встаёт слот. */
function treeWith(children: AssemblyTree["components"]["nodes"][string]["children"]): AssemblyTree {
  return {
    components: {
      root: "root",
      nodes: {
        root: { id: "root", type: "widget", parentId: null, children: ["content"] },
        content: {
          id: "content",
          type: "widget.content",
          parentId: "root",
          children,
          props: { "data-static": "literal" },
          bind: { variant: "/variant" },
        },
        text: { id: "text", genus: "text", value: "declared", parentId: "content", children: [] },
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

function mount(tree: AssemblyTree, slots: Parameters<typeof RenderTree>[0]["slots"]) {
  const host = document.createElement("div");
  document.body.append(host);
  dispose = render(
    () => <RenderTree registry={REGISTRY} tree={tree} data={{ variant: "s1" }} slots={slots} />,
    host,
  );
  return host;
}

describe("RenderTree slots (PWEB-174/176) — контент узла сверху, узел резолвится как обычно", () => {
  it('placement "replace" (умолчание) — слот замещает ПУСТЫХ детей, обёртка узла реально вызвана', () => {
    const host = mount(treeWith([]), {
      "widget.content": { render: () => <span data-testid="slot">SLOT</span> },
    });

    // Обёртка (`resolveComponent` дошёл до реестра, не был обойдён) — ключевая проверка находки.
    const wrapper = host.querySelector('[data-testid="wrapper"][data-static="literal"]');
    expect(wrapper).not.toBeNull();
    expect(wrapper?.querySelector('[data-testid="slot"]')?.textContent).toBe("SLOT");
  });

  it('placement "before" — слот встаёт ПЕРЕД объявленными детьми', () => {
    const host = mount(treeWith(["text"]), {
      "widget.content": { render: () => <span data-testid="slot">SLOT</span>, placement: "before" },
    });

    const wrapper = host.querySelector('[data-testid="wrapper"][data-static="literal"]')!;
    expect(wrapper.textContent).toBe("SLOTdeclared");
  });

  it('placement "after" — слот встаёт ПОСЛЕ объявленных детей', () => {
    const host = mount(treeWith(["text"]), {
      "widget.content": { render: () => <span data-testid="slot">SLOT</span>, placement: "after" },
    });

    const wrapper = host.querySelector('[data-testid="wrapper"][data-static="literal"]')!;
    expect(wrapper.textContent).toBe("declaredSLOT");
  });

  it("слот получает резолвленные пропы узла — литерал (props) и bind вместе", () => {
    const resolved: unknown[] = [];
    mount(treeWith([]), {
      "widget.content": {
        render: (props) => {
          resolved.push(props);
          return <span data-testid="slot">SLOT</span>;
        },
      },
    });

    expect(resolved).toEqual([{ "data-static": "literal", variant: "s1" }]);
  });

  it("без совпадающего адреса в slots — дерево рисуется как раньше, регрессии нет", () => {
    const host = mount(treeWith(["text"]), { "widget.other": { render: () => <span>never</span> } });

    const wrapper = host.querySelector('[data-testid="wrapper"][data-static="literal"]')!;
    expect(wrapper.textContent).toBe("declared");
    expect(wrapper.querySelector('[data-testid="slot"]')).toBeNull();
  });

  it("slots вовсе не задан — дерево рисуется как раньше, регрессии нет", () => {
    const host = mount(treeWith(["text"]), undefined);

    const wrapper = host.querySelector('[data-testid="wrapper"][data-static="literal"]')!;
    expect(wrapper.textContent).toBe("declared");
  });
});
