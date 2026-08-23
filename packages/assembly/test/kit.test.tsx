// Механика на ЖИВОМ ките: настоящая кнопка, настоящий паспорт, настоящее правило допуска.
//
// Остальные пробы отрисовки держат свои компоненты — так они проверяют механику, а не кит.
// Здесь наоборот, и предмет ровно один: свойства, которыми механика ПОЛЬЗУЕТСЯ, но которыми не
// владеет.
//
//   • признак узла (`data-node`) доезжает до разметки только потому, что кит прозрачен —
//     произвольные пропы он форвардит на свой узел. Перестанет — вторая область адреса
//     (правка образца по идентификатору) молча перестанет существовать в разметке, а запись
//     останется, и чинить будут генератор;
//   • адресные атрибуты кита (`data-scope`/`data-part`) на узле сохраняются: признак механики
//     их не вытесняет. Разъедься это — координата и идентификатор перестали бы быть двумя
//     областями ОДНОГО узла.
//
// Кит здесь — `devDependency`; в поставку механики он не едет.

import { kitOf, Popover, PopoverTrigger } from "@omnifield/probe-web-ui";
import { admits, coordinateOf, passportOf } from "@omnifield/probe-web-ui/passport";
import { afterEach, describe, expect, it } from "vitest";

import type { ReadablePassport } from "../src/passport-read.js";
import { coordinateOfType } from "../src/coordinate.js";
import {
  checkRegistry,
  createRegistry,
  readAddress,
  resolveComponent,
  type ReadableComponent,
} from "../src/registry.js";
import { RenderTree } from "../src/render.jsx";
import type { AssemblyTree } from "../src/tree.js";
import { cleanup, mount } from "./dom.jsx";

afterEach(cleanup);

/**
 * Пара поставщика по имени компонента — то, из чего складывается реестр (`PWEB-85`).
 *
 * Присваивание к `ReadableComponent` и есть проверка формы: не подойди пара кита механике как
 * есть — не собрались бы типы, и это покраснело бы здесь, а не у потребителя через выпуск.
 */
const пара = (component: string): ReadableComponent => {
  const kit = kitOf(component);
  if (!kit) throw new Error(`кит не отдаёт компонента «${component}»`);
  return kit;
};

const registry = createRegistry({ components: { button: пара("button") }, admits });

const tree: AssemblyTree = {
  components: {
    root: "сохранить",
    nodes: {
      сохранить: {
        id: "сохранить",
        type: "button",
        parentId: null,
        children: ["подпись"],
      },
      // Содержимое — узел дерева, а не проп (`PWEB-83`).
      подпись: {
        id: "подпись",
        genus: "text",
        value: "Сохранить",
        parentId: "сохранить",
        children: [],
      },
    },
  },
};

describe("пара поставщика складывается в реестр как есть", () => {
  // `PWEB-85`. Предмет — ШОВ: пара, собранная и сверенная у поставщика, ложится в реестр без
  // единого преобразования, и переписанного перечня частей в потребителе не остаётся.

  it("пара кита не даёт ни одного изъяна — карта покрывает анатомию", () => {
    const весь = createRegistry({
      components: { button: пара("button"), accordion: пара("accordion") },
      admits,
    });

    expect(checkRegistry(весь)).toEqual([]);
  });

  it("каждая часть анатомии разрешается в компонент — по адресу из разбора", () => {
    const kit = пара("accordion");
    const реестр = createRegistry({ components: { accordion: kit }, admits });

    for (const part of kit.passport.anatomy.keys()) {
      const адрес = part === kit.passport.root ? "accordion" : `accordion.${part}`;
      expect(readAddress(реестр, адрес)?.address).toBe(адрес);
      expect(resolveComponent(реестр, адрес)).toBeTypeOf("function");
    }
  });
});

describe("дерево из настоящих компонентов кита", () => {
  it("рисуется по данным", () => {
    const host = mount(() => <RenderTree tree={tree} registry={registry} />);
    const button = host.querySelector("button");

    expect(button).not.toBeNull();
    expect(button?.textContent).toBe("Сохранить");
  });

  it("узел адресуем в разметке: признак механики долетает через кит", () => {
    const host = mount(() => <RenderTree tree={tree} registry={registry} />);

    expect(host.querySelector("button")?.getAttribute("data-node")).toBe("сохранить");
  });

  it("адрес кита на узле остаётся — координата и идентификатор живут вместе", () => {
    const host = mount(() => <RenderTree tree={tree} registry={registry} />);
    const button = host.querySelector("button") as HTMLElement;

    expect(button.getAttribute("data-scope")).toBe("button");
    expect(button.getAttribute("data-part")).toBe("root");
    expect(button.getAttribute("data-node")).toBe("сохранить");
  });

  it("шов сходится: координата с живого узла совпадает с координатой по адресу", () => {
    // Две половины моста написаны в РАЗНЫХ зонах и разными людьми: кит снимает координату с
    // живого узла разметки, механика — с адреса узла в дереве. Совпадение здесь и есть шов;
    // разъедься он — редактор одел бы одно, а показал другое, и обе стороны были бы зелёными.
    const host = mount(() => <RenderTree tree={tree} registry={registry} />);
    const button = host.querySelector("button") as Element;

    const fromMarkup = coordinateOf(button, passportOf);
    const fromTree = coordinateOfType(registry, "button");

    // Сначала — что обе стороны вообще ответили: сравнение двух `undefined` совпало бы и было
    // бы зелёным от пустоты.
    expect(fromMarkup).toBeDefined();
    expect(fromTree).toBeDefined();

    expect(fromMarkup?.component).toBe(fromTree?.component);
    expect(fromMarkup?.part).toBe(fromTree?.part);
    expect(fromTree?.part).toBe("root");
  });

  it("украшенный узел подписан так же — путь редактора не меняет адресации", () => {
    const host = mount(() => (
      <RenderTree
        tree={tree}
        registry={registry}
        editOverlay={(props) => <i data-overlay={props.nodeId} />}
      />
    ));
    const button = host.querySelector("button") as HTMLElement;

    expect(button.getAttribute("data-node")).toBe("сохранить");
    expect(button.getAttribute("data-scope")).toBe("button");
    expect(button.querySelector("[data-overlay]")).not.toBeNull();
  });
});

describe("композиция на живом ките", () => {
  // «Кнопка, вставленная в триггер всплывающего окна» — тот самый случай, ради которого узел
  // научился нести композицию. Здесь он проверяется НЕ на своих компонентах: собирает узел
  // настоящий `PopoverTrigger`, рисует настоящая `Button`, состояние приходит от настоящего
  // окна.
  //
  // ПРЕДЕЛ, названный заранее: паспорта у окна пока нет — адрес сегодня несёт один компонент
  // кита, остальные объявляются волной разноса (`PWEB-7`). Поэтому внешняя часть объявлена
  // здесь фикстурой: минимальной, только чтобы механике было по чему проверить вложенность.
  // В поставку она не едет; появится настоящий паспорт — проба возьмёт его и станет строже.
  const окно: ReadablePassport = {
    component: "popover",
    genus: "component",
    anatomy: { keys: () => ["root", "trigger"] },
    root: "root",
    parts: [
      { name: "root", accepts: [{ kind: "part", name: "trigger" }] },
      { name: "trigger", accepts: [{ kind: "content", genus: "component" }] },
    ],
  };

  const составной = createRegistry({
    components: {
      button: пара("button"),
      // Пары у окна нет по той же причине, что и паспорта: компонент ещё не объявлен. Складываем
      // её здесь той же формой — механике неоткуда узнать, кто её собрал.
      popover: { passport: окно, parts: { root: Popover, trigger: PopoverTrigger } },
    },
    admits,
  });

  const дерево: AssemblyTree = {
    components: {
      root: "окно",
      nodes: {
        окно: {
          id: "окно",
          type: "popover",
          parentId: null,
          children: ["настройки"],
          props: { open: true },
        },
        настройки: {
          id: "настройки",
          type: "button",
          composedInto: "popover.trigger",
          parentId: "окно",
          children: ["подпись"],
        },
        подпись: {
          id: "подпись",
          genus: "text",
          value: "Настройки",
          parentId: "настройки",
          children: [],
        },
      },
    },
  };

  it("собирается живой узел: один элемент, а не два", () => {
    const host = mount(() => <RenderTree tree={дерево} registry={составной} />);

    expect(host.querySelectorAll("button")).toHaveLength(1);
    expect(host.querySelector("button")?.textContent).toBe("Настройки");
  });

  it("адрес на узле — кнопкин, а не триггерный", () => {
    const host = mount(() => <RenderTree tree={дерево} registry={составной} />);
    const button = host.querySelector("button") as HTMLElement;

    expect(button.getAttribute("data-scope")).toBe("button");
    expect(button.getAttribute("data-part")).toBe("root");
  });

  it("состояние раскрытия приходит от окна и остаётся адресуемым", () => {
    const host = mount(() => <RenderTree tree={дерево} registry={составной} />);
    const button = host.querySelector("button") as HTMLElement;

    // Состояние выражено ОТДЕЛЬНЫМ атрибутом, а не адресом, поэтому композицию оно переживает
    // само. Скин адресует его по имени из паспорта кнопки — там `data-expanded` объявлено.
    expect(button.hasAttribute("data-expanded")).toBe(true);
    expect(button.getAttribute("aria-expanded")).toBe("true");
  });

  it("признак узла доезжает и через два звена композиции", () => {
    const host = mount(() => <RenderTree tree={дерево} registry={составной} />);

    expect(host.querySelector("button")?.getAttribute("data-node")).toBe("настройки");
  });

  it("координата составного узла — кнопкина: одевается он как кнопка", () => {
    const host = mount(() => <RenderTree tree={дерево} registry={составной} />);
    const button = host.querySelector("button") as Element;

    expect(coordinateOf(button, passportOf)?.component).toBe("button");
    expect(coordinateOfType(составной, "button")?.component).toBe("button");
  });
});

describe("содержимое рядом с частью — на живой гармошке", () => {
  // ГЛАВНАЯ строка `PWEB-83`, и проверяется она там, где дыра открылась: у настоящей кнопки
  // раздела допустимы СРАЗУ и часть-указатель, и содержимое двух родов. Прежняя форма показывала
  // одно из двух — есть вложенная часть, подпись молча пропадала.
  //
  // Пара берётся у поставщика целиком (`kitOf`, `PWEB-84`/`PWEB-85`), а не складывается здесь:
  // плоские имена кита (`AccordionItemTrigger`) с адресами через точку не совпадают ни одним, и
  // собранная тут карта была бы догадкой, которую никто не сверит с анатомией.

  const гармошка = createRegistry({ components: { accordion: пара("accordion") }, admits });

  /**
   * Раздел гармошки: кнопка с указателем и подписью. Порядок детей задаёт вызывающий — им же
   * выражается «подпись, потом стрелка» и обратное.
   */
  const разделС = (порядок: readonly string[]): AssemblyTree => ({
    components: {
      root: "набор",
      nodes: {
        набор: {
          id: "набор",
          type: "accordion",
          parentId: null,
          children: ["раздел"],
          props: { defaultValue: ["доставка"] },
        },
        раздел: {
          id: "раздел",
          type: "accordion.item",
          parentId: "набор",
          children: ["кнопка"],
          props: { value: "доставка" },
        },
        кнопка: {
          id: "кнопка",
          type: "accordion.itemTrigger",
          parentId: "раздел",
          children: порядок,
        },
        текст: { id: "текст", genus: "text", value: "Доставка", parentId: "кнопка", children: [] },
        стрелка: {
          id: "стрелка",
          type: "accordion.itemIndicator",
          parentId: "кнопка",
          children: ["знак"],
        },
        знак: { id: "знак", genus: "text", value: "▾", parentId: "стрелка", children: [] },
      },
    },
  });

  it("кнопка раздела с указателем СОХРАНЯЕТ подпись", () => {
    const host = mount(() => <RenderTree tree={разделС(["текст", "стрелка"])} registry={гармошка} />);
    const кнопка = host.querySelector('[data-part="item-trigger"]') as HTMLElement;

    // Обе стороны сразу: вложенная часть на месте И подпись на месте.
    expect(кнопка.querySelector('[data-part="item-indicator"]')).not.toBeNull();
    expect(кнопка.textContent).toContain("Доставка");
  });

  it("порядок относительно части выразим, и он оба", () => {
    const подписьПервой = mount(() => (
      <RenderTree tree={разделС(["текст", "стрелка"])} registry={гармошка} />
    ));
    expect(
      (подписьПервой.querySelector('[data-part="item-trigger"]') as HTMLElement).textContent,
    ).toBe("Доставка▾");

    cleanup();

    const стрелкаПервой = mount(() => (
      <RenderTree tree={разделС(["стрелка", "текст"])} registry={гармошка} />
    ));
    expect(
      (стрелкаПервой.querySelector('[data-part="item-trigger"]') as HTMLElement).textContent,
    ).toBe("▾Доставка");
  });

  it("адреса частей на узлах остаются — содержимое их не вытесняет", () => {
    const host = mount(() => <RenderTree tree={разделС(["текст", "стрелка"])} registry={гармошка} />);
    const указатель = host.querySelector('[data-part="item-indicator"]') as HTMLElement;

    expect(указатель.getAttribute("data-scope")).toBe("accordion");
    expect(указатель.getAttribute("data-node")).toBe("стрелка");
    expect(указатель.textContent).toBe("▾");
  });

  it("координата кнопки раздела читается механикой — одевается она как часть", () => {
    const host = mount(() => <RenderTree tree={разделС(["текст", "стрелка"])} registry={гармошка} />);
    const кнопка = host.querySelector('[data-part="item-trigger"]') as Element;

    const сРазметки = coordinateOf(кнопка, passportOf);
    const сДерева = coordinateOfType(гармошка, "accordion.itemTrigger");

    expect(сРазметки).toBeDefined();
    expect(сДерева).toBeDefined();
    expect(сРазметки?.part).toBe(сДерева?.part);
    expect(сДерева?.part).toBe("itemTrigger");
  });
});
