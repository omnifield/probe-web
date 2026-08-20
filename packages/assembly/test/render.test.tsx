// Отрисовка по данным — гейт задачи целиком:
//
//   • дерево собирается и рисуется по данным;
//   • узел с неразрешённым адресом даёт ЯВНЫЙ запасной вид, а не тишину;
//   • упавший узел не уносит соседей;
//   • слот украшения достаётся каждому узлу и не влияет на путь отрисовки, когда не задан.
//
// Структура перенесена из `src/__tests__/renderer.test.tsx` старого репозитория; выброшено
// всё про `interactions` и шкалу режимов (см. README, «Что снято»), добавлено то, чего там
// быть не могло: украшение узла, не пускающего содержимое, решается ПАСПОРТОМ, а не списком
// адресов внутри отрисовки.

import { createSignal, type Component } from "solid-js";
import { Dynamic } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createRegistry } from "../src/registry.js";
import { RenderTree, type EditOverlayProps, type ErrorFallbackProps } from "../src/render.jsx";
import type { AssemblyTree } from "../src/tree.js";
import { cleanup, mount } from "./dom.jsx";
import { PASSPORTS, RULE } from "./passports.js";

afterEach(cleanup);

/**
 * Раскладка — как настоящий компонент кита: произвольные пропы форвардит в корневой узел.
 *
 * Это не удобство пробы, а свойство, на котором держится признак узла: механика ставит его
 * пропом, и до разметки он доезжает ровно потому, что кит прозрачен.
 */
const Layout: Component<Record<string, unknown>> = (props) => (
  <div data-scope="layout" {...props}>
    {props.children as never}
  </div>
);

/** Кнопка — тоже прозрачная: чужие пропы уезжают на её единственный узел. */
const Button: Component<Record<string, unknown>> = (props) => (
  <button type="button" data-scope="button" data-label={props.label as string} {...props}>
    {props.children as never}
  </button>
);

/**
 * Значок — узел без детей: содержимого потребителя его паспорт не пускает.
 *
 * Прозрачен так же, как остальные: узел, не принимающий содержимое, всё равно обязан быть
 * адресуем — правка образца применяется и к нему.
 */
const Icon: Component<Record<string, unknown>> = (props) => (
  <img data-scope="icon" alt="" {...props} />
);

/** Всплывающее окно — просто держит содержимое; составным его делает триггер внутри. */
const Popover: Component<Record<string, unknown>> = (props) => (
  <div data-scope="popover" {...props}>
    {props.children as never}
  </div>
);

/**
 * Внешнее звено композиции — устроено как настоящее: рисует то, что пришло в `as`, и отдаёт
 * ему своё поведение и состояние. Свой адрес при этом НЕ ставит: адрес принадлежит внутреннему.
 */
interface TriggerProps {
  /** Внутреннее звено композиции — то, чем узел является визуально. */
  as?: Component<Record<string, unknown>> | string;
  children?: unknown;
}

const Trigger: Component<TriggerProps> = (props) => (
  // `as` уходит из пропов после спреда: он не проп потребителя, а то, из чего узел собран.
  <Dynamic component={props.as ?? "button"} {...props} as={undefined} data-expanded="">
    {props.children as never}
  </Dynamic>
);

const Boom: Component = () => {
  throw new Error("узел не собрался");
};

const registry = createRegistry({
  components: {
    layout: Layout,
    button: Button,
    icon: Icon,
    boom: Boom,
    // Компонент И пространство имён разом — так устроены namespace-компоненты кита
    // (`Popover.Trigger`), и реестр их принимает как есть: разрешение адреса идёт по
    // свойствам, а свойства есть и у функции.
    popover: Object.assign(Popover, { trigger: Trigger, content: Layout }),
    ui: { button: Button },
  },
  // `boom` — компонент, который падает при отрисовке; паспорт ему нужен кнопочный: предмет
  // пробы в том, что упавший узел не уносит соседей, а не в его вложенности.
  passports: { ...PASSPORTS, boom: PASSPORTS.button },
  ...RULE,
});

const tree = (nodes: AssemblyTree["components"]["nodes"], root = "page"): AssemblyTree => ({
  components: { root, nodes },
});

const page = tree({
  page: { id: "page", type: "layout", parentId: null, children: ["one", "two"] },
  one: { id: "one", type: "button", parentId: "page", children: [], props: { children: "Да" } },
  two: { id: "two", type: "button", parentId: "page", children: [], props: { children: "Нет" } },
});

describe("отрисовка по данным", () => {
  it("рисует лист с текстом из пропов", () => {
    const host = mount(() => <RenderTree tree={page} registry={registry} />);

    expect(host.querySelectorAll("button")).toHaveLength(2);
    expect(host.textContent).toBe("ДаНет");
  });

  it("рисует вложенное дерево, сохраняя порядок детей", () => {
    const host = mount(() => <RenderTree tree={page} registry={registry} />);
    const labels = [...host.querySelectorAll("button")].map((node) => node.textContent);

    expect(labels).toEqual(["Да", "Нет"]);
  });

  it("идёт по адресу через точку", () => {
    const host = mount(() => (
      <RenderTree
        tree={tree({
          page: { id: "page", type: "ui.button", parentId: null, children: [], props: { children: "Вглубь" } },
        })}
        registry={registry}
      />
    ));

    expect(host.textContent).toBe("Вглубь");
  });

  it("прокидывает пропы узла в компонент как есть", () => {
    const host = mount(() => (
      <RenderTree
        tree={tree({
          page: {
            id: "page",
            type: "layout",
            parentId: null,
            children: [],
            props: { "aria-label": "холст" },
          },
        })}
        registry={registry}
      />
    ));

    expect(host.querySelector("[data-scope=layout]")?.getAttribute("aria-label")).toBe("холст");
  });

  it("правка узла доезжает до живого компонента, не пересобирая его", () => {
    const [current, setCurrent] = createSignal(
      tree({
        page: { id: "page", type: "button", parentId: null, children: [], props: { label: "первый" } },
      }),
    );

    const host = mount(() => <RenderTree tree={current()} registry={registry} />);
    const before = host.querySelector("button");

    setCurrent(
      tree({
        page: { id: "page", type: "button", parentId: null, children: [], props: { label: "второй" } },
      }),
    );

    expect(host.querySelector("button")?.getAttribute("data-label")).toBe("второй");
    // Тот же узел документа: сменился проп, а не компонент.
    expect(host.querySelector("button")).toBe(before);
  });

  it("добавление ребёнка в дерево появляется в разметке", () => {
    const [current, setCurrent] = createSignal(
      tree({
        page: { id: "page", type: "layout", parentId: null, children: [] },
      }),
    );

    const host = mount(() => <RenderTree tree={current()} registry={registry} />);
    expect(host.querySelectorAll("button")).toHaveLength(0);

    setCurrent(
      tree({
        page: { id: "page", type: "layout", parentId: null, children: ["one"] },
        one: { id: "one", type: "button", parentId: "page", children: [], props: { children: "Да" } },
      }),
    );

    expect(host.querySelectorAll("button")).toHaveLength(1);
  });

  it("смена адреса узла меняет компонент", () => {
    const [current, setCurrent] = createSignal(
      tree({ page: { id: "page", type: "button", parentId: null, children: [] } }),
    );

    const host = mount(() => <RenderTree tree={current()} registry={registry} />);
    expect(host.querySelector("button")).not.toBeNull();

    setCurrent(tree({ page: { id: "page", type: "icon", parentId: null, children: [] } }));

    expect(host.querySelector("button")).toBeNull();
    expect(host.querySelector("img")).not.toBeNull();
  });

  it("дерева нет вовсе — рисует ничего и не падает", () => {
    const host = mount(() => <RenderTree registry={registry} />);
    expect(host.innerHTML).toBe("");
  });

  it("дерево пустое — то же самое", () => {
    const host = mount(() => <RenderTree tree={tree({}, "")} registry={registry} />);
    expect(host.innerHTML).toBe("");
  });
});

describe("признак узла в разметке", () => {
  // Вторая область адреса — правка образца по идентификатору узла — существовала только в
  // записи: разметка о ней ничего не знала. Признак ставит МЕХАНИКА, потому что потребитель о
  // дереве не знает, а редактор, ставящий его сам, разошёлся бы со вторым редактором.

  it("каждый узел подписан своим именем", () => {
    const host = mount(() => <RenderTree tree={page} registry={registry} />);

    expect(host.querySelector("[data-scope=layout]")?.getAttribute("data-node")).toBe("page");
    expect([...host.querySelectorAll("button")].map((node) => node.getAttribute("data-node"))).toEqual(
      ["one", "two"],
    );
  });

  it("признак есть и когда узел украшен — обоими путями", () => {
    const Overlay: Component<EditOverlayProps> = (props) => <i data-overlay={props.nodeId} />;

    const host = mount(() => (
      <RenderTree
        tree={tree({
          page: { id: "page", type: "layout", parentId: null, children: ["знак"] },
          знак: { id: "знак", type: "icon", parentId: "page", children: [] },
        })}
        registry={registry}
        editOverlay={Overlay}
      />
    ));

    // Путь «украшение внутрь» — раскладка.
    expect(host.querySelector("[data-scope=layout]")?.getAttribute("data-node")).toBe("page");
    // Путь «украшение обёрткой» — значок содержимого не пускает, но подписан так же.
    expect(host.querySelector("img")?.getAttribute("data-node")).toBe("знак");
  });

  it("собственным пропом признак не перебить — иначе правило промахнулось бы молча", () => {
    const host = mount(() => (
      <RenderTree
        tree={tree({
          page: {
            id: "page",
            type: "layout",
            parentId: null,
            children: [],
            props: { "data-node": "подделка" },
          },
        })}
        registry={registry}
      />
    ));

    expect(host.querySelector("[data-scope=layout]")?.getAttribute("data-node")).toBe("page");
  });

  it("признак следует за именем узла при смене дерева", () => {
    const [current, setCurrent] = createSignal(
      tree({ page: { id: "page", type: "layout", parentId: null, children: ["один"] },
        один: { id: "один", type: "button", parentId: "page", children: [] } }),
    );

    const host = mount(() => <RenderTree tree={current()} registry={registry} />);
    expect(host.querySelector("button")?.getAttribute("data-node")).toBe("один");

    setCurrent(
      tree({ page: { id: "page", type: "layout", parentId: null, children: ["другой"] },
        другой: { id: "другой", type: "button", parentId: "page", children: [] } }),
    );

    expect(host.querySelector("button")?.getAttribute("data-node")).toBe("другой");
  });
});

describe("неразрешённый адрес", () => {
  it("зовёт запасной вид с адресом и именем узла", () => {
    const Fallback: Component<{ type: string; nodeId: string }> = (props) => (
      <div data-missing={props.type} data-node={props.nodeId} />
    );

    const host = mount(() => (
      <RenderTree
        tree={tree({ page: { id: "page", type: "нет.такого", parentId: null, children: [] } })}
        registry={registry}
        fallback={Fallback}
      />
    ));

    const missing = host.querySelector("[data-missing]");
    expect(missing?.getAttribute("data-missing")).toBe("нет.такого");
    expect(missing?.getAttribute("data-node")).toBe("page");
  });

  it("ветка карты компонентом не считается — это тот же неразрешённый адрес", () => {
    const Fallback: Component<{ type: string }> = (props) => <div data-missing={props.type} />;

    const host = mount(() => (
      <RenderTree
        tree={tree({ page: { id: "page", type: "ui", parentId: null, children: [] } })}
        registry={registry}
        fallback={Fallback}
      />
    ));

    expect(host.querySelector("[data-missing]")?.getAttribute("data-missing")).toBe("ui");
  });

  it("без своего запасного вида не рисует ничего и не роняет соседей", () => {
    const host = mount(() => (
      <RenderTree
        tree={tree({
          page: { id: "page", type: "layout", parentId: null, children: ["нетто", "two"] },
          нетто: { id: "нетто", type: "нет.такого", parentId: "page", children: [] },
          two: { id: "two", type: "button", parentId: "page", children: [], props: { children: "Жив" } },
        })}
        registry={registry}
      />
    ));

    expect(host.textContent).toBe("Жив");
  });
});

describe("упавший узел", () => {
  it("не уносит соседей", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    const host = mount(() => (
      <RenderTree
        tree={tree({
          page: { id: "page", type: "layout", parentId: null, children: ["плохой", "two"] },
          плохой: { id: "плохой", type: "boom", parentId: "page", children: [] },
          two: { id: "two", type: "button", parentId: "page", children: [], props: { children: "Жив" } },
        })}
        registry={registry}
      />
    ));

    expect(host.textContent).toBe("Жив");
    error.mockRestore();
  });

  it("зовёт свой запасной вид с именем узла, адресом и ошибкой", () => {
    const seen: ErrorFallbackProps[] = [];
    const ErrorFallback: Component<ErrorFallbackProps> = (props) => {
      seen.push(props);
      return <div data-fell={props.nodeId} />;
    };

    const host = mount(() => (
      <RenderTree
        tree={tree({ page: { id: "page", type: "boom", parentId: null, children: [] } })}
        registry={registry}
        errorFallback={ErrorFallback}
      />
    ));

    expect(host.querySelector("[data-fell]")?.getAttribute("data-fell")).toBe("page");
    expect(seen[0]?.type).toBe("boom");
    expect((seen[0]?.error as Error).message).toBe("узел не собрался");
    expect(typeof seen[0]?.reset).toBe("function");
  });
});

describe("слот украшения", () => {
  const Overlay: Component<EditOverlayProps> = (props) => (
    <i data-overlay={props.nodeId} data-type={props.node.type} />
  );

  it("не задан — путь отрисовки прежний, лишних узлов нет", () => {
    const plain = mount(() => <RenderTree tree={page} registry={registry} />).innerHTML;

    expect(plain).not.toContain("position:relative");
    expect(plain).not.toContain("data-overlay");
  });

  it("задан — украшение достаётся КАЖДОМУ узлу", () => {
    const host = mount(() => (
      <RenderTree tree={page} registry={registry} editOverlay={Overlay} />
    ));

    expect(host.querySelectorAll("[data-overlay]")).toHaveLength(3);
    expect([...host.querySelectorAll("[data-overlay]")].map((n) => n.getAttribute("data-overlay"))).toEqual(
      expect.arrayContaining(["page", "one", "two"]),
    );
  });

  it("настоящее содержимое узла при этом остаётся", () => {
    const host = mount(() => (
      <RenderTree tree={page} registry={registry} editOverlay={Overlay} />
    ));

    expect(host.textContent).toBe("ДаНет");
    expect(host.querySelectorAll("button")).toHaveLength(2);
  });

  it("узлу, пускающему содержимое, украшение кладётся ВНУТРЬ, без обёртки", () => {
    const host = mount(() => (
      <RenderTree
        tree={tree({ page: { id: "page", type: "button", parentId: null, children: [] } })}
        registry={registry}
        editOverlay={Overlay}
      />
    ));

    const button = host.querySelector("button") as HTMLElement;
    expect(button.querySelector("[data-overlay]")).not.toBeNull();
    expect(button.style.position).toBe("relative");
    expect(host.firstElementChild).toBe(button);
  });

  it("узлу, не пускающему содержимое, — обёртка снаружи, и НЕ `display:contents`", () => {
    // Паспорт значка объявил `content: "none"`: внутрь класть нельзя, и украшение идёт рядом.
    // `display:contents` не годится по правилам CSS — такой элемент не создаёт бокса, и
    // `position:relative` на нём игнорируется: украшение растянулось бы по родителю.
    const host = mount(() => (
      <RenderTree
        tree={tree({ page: { id: "page", type: "icon", parentId: null, children: [] } })}
        registry={registry}
        editOverlay={Overlay}
      />
    ));

    const wrapper = host.firstElementChild as HTMLElement;
    expect(wrapper.tagName).toBe("SPAN");
    expect(wrapper.style.display).toBe("block");
    expect(wrapper.style.position).toBe("relative");
    expect(wrapper.querySelector("img")).not.toBeNull();
    expect(wrapper.querySelector("[data-overlay]")).not.toBeNull();
  });

  it("узел с неразрешённым адресом украшение тоже получает", () => {
    const host = mount(() => (
      <RenderTree
        tree={tree({ page: { id: "page", type: "нет.такого", parentId: null, children: [] } })}
        registry={registry}
        editOverlay={Overlay}
      />
    ));

    expect(host.querySelector("[data-overlay]")?.getAttribute("data-overlay")).toBe("page");
  });

  it("украшение несёт сам узел, а не только его имя", () => {
    const host = mount(() => (
      <RenderTree tree={page} registry={registry} editOverlay={Overlay} />
    ));

    expect(host.querySelector("[data-overlay=one]")?.getAttribute("data-type")).toBe("button");
  });

  it("украшение не ловит события — ловлю включает сам хозяин", () => {
    const host = mount(() => (
      <RenderTree tree={page} registry={registry} editOverlay={Overlay} />
    ));

    const slot = host.querySelector("[data-overlay]")?.parentElement as HTMLElement;
    expect(slot.style.pointerEvents).toBe("none");
    expect(slot.getAttribute("aria-hidden")).toBe("true");
  });
});

describe("композиция", () => {
  // Узел несёт адрес кнопки и указание, во что она вставлена. Собрать из этого живой узел —
  // работа отрисовки: внешний зовётся с `as`, потому что так композицию делает сам кит.
  const составной = tree({
    окно: { id: "окно", type: "popover", parentId: null, children: ["настройки"] },
    настройки: {
      id: "настройки",
      type: "button",
      composedInto: "popover.trigger",
      parentId: "окно",
      children: [],
      props: { children: "Настройки" },
    },
  }, "окно");

  it("рисует ОДИН узел: внешний собирает, внутренний рисуется", () => {
    const host = mount(() => <RenderTree tree={составной} registry={registry} />);

    expect(host.querySelectorAll("button")).toHaveLength(1);
    expect(host.querySelector("button")?.textContent).toBe("Настройки");
  });

  it("узел несёт адрес ВНУТРЕННЕГО — кнопки, а не триггера", () => {
    const host = mount(() => <RenderTree tree={составной} registry={registry} />);

    expect(host.querySelector("button")?.getAttribute("data-scope")).toBe("button");
  });

  it("состояние приходит от внешнего и остаётся на узле", () => {
    const host = mount(() => <RenderTree tree={составной} registry={registry} />);

    expect(host.querySelector("button")?.hasAttribute("data-expanded")).toBe(true);
  });

  it("признак узла доезжает и через композицию", () => {
    const host = mount(() => <RenderTree tree={составной} registry={registry} />);

    expect(host.querySelector("button")?.getAttribute("data-node")).toBe("настройки");
  });

  it("неразрешённый ВНЕШНИЙ адрес называет себя, а не внутренний", () => {
    // У составного узла адреса два, и «не нашёлся триггер» отличается от «не нашлась кнопка»
    // ровно тем, что человек пойдёт чинить.
    const Fallback: Component<{ type: string }> = (props) => <div data-missing={props.type} />;
    const host = mount(() => (
      <RenderTree
        tree={tree({
          узел: {
            id: "узел",
            type: "button",
            composedInto: "нет.такого",
            parentId: null,
            children: [],
          },
        }, "узел")}
        registry={registry}
        fallback={Fallback}
      />
    ));

    expect(host.querySelector("[data-missing]")?.getAttribute("data-missing")).toBe("нет.такого");
  });

  it("украшение достаётся составному узлу так же, как обычному", () => {
    const Overlay: Component<EditOverlayProps> = (props) => <i data-overlay={props.nodeId} />;
    const host = mount(() => (
      <RenderTree tree={составной} registry={registry} editOverlay={Overlay} />
    ));

    expect(host.querySelector("[data-overlay=настройки]")).not.toBeNull();
    expect(host.querySelector("button")?.getAttribute("data-node")).toBe("настройки");
  });

  it("обычный узел путь отрисовки не меняет — ни `as`, ни лишних узлов", () => {
    const host = mount(() => <RenderTree tree={page} registry={registry} />);

    expect(host.innerHTML).not.toContain("as=");
    expect(host.querySelectorAll("button")).toHaveLength(2);
    expect(host.querySelector("button")?.hasAttribute("data-expanded")).toBe(false);
  });
});
