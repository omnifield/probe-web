// PWEB — `on`/`dispatch` не мог выразить «отправь то, что юзер только что напечатал»: контекст
// резолвился ТОЛЬКО из `action.event.context` (литерал | `DataBinding` из данных показа), само
// живое DOM-событие обработчику не приходило вовсе (`() => {...}` без параметра). Работало для
// клика по готовому item'у (payload уже лежит в данных), но не для текстового инпута/textarea/
// range/select — везде, где значение рождается в момент события, не раньше. Третий источник —
// `EventBinding` (`{ event: "путь.в.событие" }`, `engine/tree.ts`) — читает само событие ДО того,
// как `dispatch` отдаст наружу чистый JSON (`render/props.ts`'s `dispatchHandlersFor`).
//
// Первый блок — голый `dispatchHandlersFor` с поддельным событием (без DOM, без Solid): резолвинг
// трёх источников контекста бок о бок (литерал, `DataBinding`, `EventBinding`) и оба поведения
// `resolveEventBinding` (пустой путь — всё событие; отсутствующее свойство — `undefined`, значит
// ключ выпадает из контекста, тот же принцип, что уже был у `DataBinding`). Второй блок —
// РЕАЛЬНЫЙ `<input>` через `RenderTree`, тот самый repro из заявки (global-search: `table.
// setGlobalFilter(value)` нужен текущий текст инпута) — доказывает, что путь работает не только
// на синтетическом вызове, но и на настоящем браузерном `input`-событии.

import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import {
  createRegistry,
  resolveEventBinding,
  type AssemblyElement,
  type AssemblyTree,
  type DispatchedEvent,
  type Registry,
} from "../src/index.js";
import { dispatchHandlersFor } from "../src/render/props.js";
import { RenderTree } from "../src/render/index.jsx";

describe("resolveEventBinding — путь в живое событие, не в данные показа", () => {
  it("пустой путь — всё событие целиком", () => {
    const event = { target: { value: "x" } };
    expect(resolveEventBinding(event, "")).toBe(event);
  });

  it("точечный путь — вложенное свойство события", () => {
    expect(resolveEventBinding({ target: { value: "hello" } }, "target.value")).toBe("hello");
  });

  it("путь мимо формы события — undefined, не бросок", () => {
    expect(resolveEventBinding({ target: { value: "hello" } }, "currentTarget.value")).toBeUndefined();
    expect(resolveEventBinding(null, "target.value")).toBeUndefined();
  });
});

describe("dispatchHandlersFor — три источника контекста бок о бок", () => {
  const node: AssemblyElement = {
    id: "search-input",
    type: "field.input",
    parentId: null,
    children: [],
    props: {},
    on: {
      input: {
        event: {
          name: "search",
          context: {
            scope: "global",
            rowId: { path: "/id" },
            term: { event: "target.value" },
          },
        },
      },
    },
  };

  it("литерал остаётся как есть, DataBinding идёт из data, EventBinding — из события", () => {
    const dispatched: DispatchedEvent[] = [];
    const handlers = dispatchHandlersFor(node, { id: "row-7" }, (event) => dispatched.push(event));

    handlers.onInput?.({ target: { value: "acme" } } as unknown as Event);

    expect(dispatched).toHaveLength(1);
    expect(dispatched[0]?.context).toEqual({ scope: "global", rowId: "row-7", term: "acme" });
  });

  it("EventBinding на несуществующее свойство молча выпадает из контекста", () => {
    const dispatched: DispatchedEvent[] = [];
    const handlers = dispatchHandlersFor(node, { id: "row-7" }, (event) => dispatched.push(event));

    handlers.onInput?.({ currentTarget: { value: "acme" } } as unknown as Event);

    expect(dispatched[0]?.context).toEqual({ scope: "global", rowId: "row-7" });
  });
});

const Input = (props: { value?: string; onInput?: (event: Event) => void }) => (
  <input data-testid="live-input" value={props.value} onInput={(event) => props.onInput?.(event)} />
);

const REGISTRY: Registry = createRegistry({
  components: {
    field: {
      passport: {
        component: "field",
        genus: "component",
        anatomy: { keys: () => ["input"] },
        root: "input",
        parts: [{ name: "input" }],
      },
      parts: { input: Input },
    },
  },
  admits: () => true,
});

const TREE: AssemblyTree = {
  components: {
    root: "input",
    nodes: {
      input: {
        id: "input",
        type: "field",
        parentId: null,
        children: [],
        on: {
          input: {
            event: { name: "search", context: { term: { event: "target.value" } } },
          },
        },
      },
    },
  },
};

let dispose: (() => void) | undefined;
afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe("живой текстовый инпут через RenderTree — repro global-search/column-filter", () => {
  it("dispatch получает текст, набранный только что, не то, что уже лежало в data", () => {
    const dispatched: DispatchedEvent[] = [];

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(
      () => <RenderTree registry={REGISTRY} tree={TREE} dispatch={(event) => dispatched.push(event)} />,
      host,
    );

    const input = host.querySelector<HTMLInputElement>('[data-testid="live-input"]');
    expect(input).not.toBeNull();

    input!.value = "acme corp";
    input!.dispatchEvent(new Event("input", { bubbles: true }));

    expect(dispatched).toHaveLength(1);
    expect(dispatched[0]?.name).toBe("search");
    expect(dispatched[0]?.context).toEqual({ term: "acme corp" });
  });
});
