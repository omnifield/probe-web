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

import { Button, kitOf, Popover, PopoverTrigger, type PartComponent } from "@omnifield/probe-web-ui";
import { admits, coordinateOf, passportOf } from "@omnifield/probe-web-ui/passport";
import type { Component } from "solid-js";
import { createComponent } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import type { ReadablePassport } from "../src/passport-read.js";
import { coordinateOfType } from "../src/coordinate.js";
import { createRegistry } from "../src/registry.js";
import { RenderTree } from "../src/render.jsx";
import type { AssemblyTree } from "../src/tree.js";
import { cleanup, mount } from "./dom.jsx";

afterEach(cleanup);

const registry = createRegistry({
  components: { button: Button },
  passports: { button: passportOf("button") as ReadablePassport },
  admits,
});

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
      button: Button,
      popover: Object.assign(Popover, { trigger: PopoverTrigger }),
    },
    passports: { button: passportOf("button") as ReadablePassport, popover: окно },
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
  // Карта частей берётся у поставщика (`kitOf`, `PWEB-84`), а не собирается здесь по догадке:
  // плоские имена кита (`AccordionItemTrigger`) с адресами через точку не совпадают ни одним.

  /**
   * Карта компонентов по адресам: корень компонента плюс его части свойствами.
   *
   * Обёртка вокруг корня, а не дописывание частей в сам экспорт кита: чужой компонент — не наше
   * место, и правка его на время прогона осталась бы у всех проб файла.
   */
  const картаЧастей = (component: string) => {
    const kit = kitOf(component);
    if (!kit) throw new Error(`кит не отдаёт компонента «${component}»`);

    const parts = kit.parts as Readonly<Record<string, PartComponent>>;
    const Root = parts[kit.passport.root] as Component<Record<string, unknown>>;
    const ветви: Record<string, PartComponent> = {};
    for (const [part, Comp] of Object.entries(parts)) {
      if (part !== kit.passport.root) ветви[part] = Comp;
    }

    const Ветка: Component<Record<string, unknown>> = (props) => createComponent(Root, props);
    return Object.assign(Ветка, ветви);
  };

  const гармошка = createRegistry({
    components: { accordion: картаЧастей("accordion") },
    passports: { accordion: passportOf("accordion") as ReadablePassport },
    admits,
  });

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
