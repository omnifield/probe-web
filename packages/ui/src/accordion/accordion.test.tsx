// Пробы гармошки — поведение И паспорт, рядом с самим компонентом (`PWEB-37`).
//
// Гармошка взята первой из Ark потому, что на ней проверяемо то, что на кнопке проверить было
// нечем: вложенность в два уровня, несколько узлов одной координаты, предок в состоянии.
// Поэтому здесь не только «компонент рендерится», но и «механике есть что прочитать».
//
// ## ЛОВУШКА ПРОБ НА ARK, оплаченная здесь: клик без фокуса ничего не делает
//
// Машина Zag принимает `TRIGGER.CLICK` в состоянии «кнопка в фокусе». Настоящий браузер ставит
// фокус сам — нажатие указателем фокусирует кнопку до клика, — а JSDOM этого не делает, и
// `.click()` уходит в пустоту: ни раскрытия, ни `onValueChange`. Проба, написанная без фокуса,
// была бы зелёной, ничего не проверив, либо (что и случилось при разборе) утверждала бы, что
// компонент сломан. Отсюда `нажать()` ниже: сначала фокус, потом клик.
//
// ## Главное правило паспорта: он не объявляет ненаблюдаемого
//
// Всё, что записано в `accordion.anatomy.ts`, проверяется здесь на живом узле — и проверка
// двусторонняя: каждая часть анатомии обязана появиться в документе её же атрибутами, а каждый
// адресный атрибут из разметки обязан быть в анатомии.

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it, vi } from "vitest";

import { cleanup, mount, nextTask } from "../../test/dom.jsx";
import { coordinateOf, partOf, type PassportLookup } from "../passport-view.js";
import { anatomy, parts, passport } from "./accordion.anatomy.js";
import {
  Accordion,
  AccordionItem,
  AccordionItemContent,
  AccordionItemIndicator,
  AccordionItemTrigger,
} from "./accordion.jsx";

afterEach(cleanup);

const here = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(
  readFileSync(resolve(here, "..", "..", "package.json"), "utf8"),
) as { name: string };

/** Читатель паспорта под вид — им же будет пользоваться редактор. */
const lookup: PassportLookup = (component) =>
  component === passport.component ? passport : undefined;

/** Сцена, в которой видны ВСЕ части компонента разом. */
function Справка(props: { value?: string[]; onValueChange?: (details: { value: string[] }) => void }) {
  return (
    <Accordion multiple value={props.value} onValueChange={props.onValueChange}>
      <AccordionItem value="доставка">
        <h3>
          <AccordionItemTrigger>
            Доставка
            <AccordionItemIndicator>▾</AccordionItemIndicator>
          </AccordionItemTrigger>
        </h3>
        <AccordionItemContent>Курьером и самовывозом</AccordionItemContent>
      </AccordionItem>
      <AccordionItem value="оплата">
        <h3>
          <AccordionItemTrigger>Оплата</AccordionItemTrigger>
        </h3>
        <AccordionItemContent>Картой и переводом</AccordionItemContent>
      </AccordionItem>
    </Accordion>
  );
}

const scene = () => <Справка value={["доставка"]} />;

/** Нажатие, как его делает человек: фокус, затем клик. Почему так — в шапке файла. */
function нажать(node: Element): void {
  (node as HTMLElement).focus();
  (node as HTMLElement).click();
}

/**
 * Ждёт, пока условие станет верным, — но не дольше разумного.
 *
 * Нужно ровно одному месту: содержимое объявляет раскрытость ПОСЛЕ того, как соберётся его
 * высота, а это отдельный кадр. Ожидание фиксированной паузой здесь врёт в обе стороны — на
 * загруженном прогоне кадр приходит позже, а на пустом пауза тратится зря.
 */
async function дождаться(условие: () => boolean): Promise<void> {
  for (let попытка = 0; попытка < 50 && !условие(); попытка++) {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

/** Узлы части — по её же адресу из анатомии. */
function узлы(host: ParentNode, part: keyof typeof parts): Element[] {
  return [...host.querySelectorAll(`[data-part="${parts[part].attrs["data-part"]}"]`)];
}

/** Адресные атрибуты, реально доехавшие до узлов. */
function addressesInDocument(host: ParentNode): Array<{ scope: string; part: string }> {
  return [...host.querySelectorAll("[data-part]")].map((node) => ({
    scope: node.getAttribute("data-scope") ?? "",
    part: node.getAttribute("data-part") ?? "",
  }));
}

describe("Accordion", () => {
  it("каждая часть рендерит ОДИН свой узел, лишних обёрток нет", () => {
    const host = mount(scene);

    expect(узлы(host, "root").length).toBe(1);
    expect(узлы(host, "item").length).toBe(2);
    expect(узлы(host, "itemTrigger").length).toBe(2);
    expect(узлы(host, "itemContent").length).toBe(2);
    expect(узлы(host, "itemIndicator").length).toBe(1);
  });

  it("кнопка связана со своим содержимым и объявляет раскрытость", () => {
    const host = mount(scene);
    const trigger = узлы(host, "itemTrigger")[0];
    const content = узлы(host, "itemContent")[0];

    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(trigger.getAttribute("aria-controls")).toBe(content.id);
    expect(content.getAttribute("role")).toBe("region");
  });

  it("закрытый раздел остаётся в документе и прячется `hidden`", () => {
    // Отличие от прежней гармошки на kobalte, и оно по существу: та закрытый узел УДАЛЯЛА, а
    // несуществующий узел нельзя ни анимировать, ни измерить.
    const host = mount(scene);
    const закрытое = узлы(host, "itemContent")[1];

    expect(закрытое.hasAttribute("hidden")).toBe(true);
    expect(закрытое.getAttribute("data-state")).toBe("closed");
  });

  it("нажатие раскрывает раздел и зовёт обработчик потребителя", async () => {
    const onValueChange = vi.fn();
    const host = mount(() => <Справка onValueChange={onValueChange} />);

    нажать(узлы(host, "itemTrigger")[1]);
    await nextTask();

    expect(onValueChange).toHaveBeenCalledWith({ value: ["оплата"] });
    expect(узлы(host, "itemTrigger")[1].getAttribute("aria-expanded")).toBe("true");
  });

  it("`multiple` держит открытыми несколько разделов", async () => {
    const host = mount(() => <Справка />);

    нажать(узлы(host, "itemTrigger")[0]);
    await nextTask();
    нажать(узлы(host, "itemTrigger")[1]);
    await nextTask();

    expect(узлы(host, "itemTrigger").map((n) => n.getAttribute("data-state"))).toEqual([
      "open",
      "open",
    ]);
  });

  it("высоту отдаёт кастом-свойствами — анимацию пишет скин", () => {
    const host = mount(scene);

    expect(узлы(host, "itemContent")[0].getAttribute("style")).toContain("--height");
  });

  it("класса нет ни у одной части", () => {
    const host = mount(scene);

    for (const node of host.querySelectorAll("[data-part]")) {
      expect(node.hasAttribute("class")).toBe(false);
    }
  });
});

describe("паспорт: часть ↔ разметка", () => {
  it("каждая часть анатомии появляется в документе — её же атрибутами", () => {
    const host = mount(scene);
    const found = addressesInDocument(host);

    for (const part of anatomy.keys()) {
      expect(found).toContainEqual({
        scope: parts[part].attrs["data-scope"],
        part: parts[part].attrs["data-part"],
      });
    }
  });

  it("каждый адресный атрибут из разметки объявлен анатомией", () => {
    const host = mount(scene);
    const declared = anatomy.keys().map((part) => parts[part].attrs["data-part"]);

    for (const { scope, part } of addressesInDocument(host)) {
      expect(scope).toBe(passport.component);
      expect(declared).toContain(part);
    }
  });

  it("селектор части находит узел — иначе правило скина мёртвое", () => {
    const host = mount(scene);

    for (const part of anatomy.keys()) {
      const own = parts[part].selector.split(",")[0].replace("&", "").trim();

      expect(host.querySelector(own)).not.toBeNull();
    }
  });
});

describe("паспорт: состояния", () => {
  /** Объявленная разметка состояния части — то, за что зацепится скин. */
  function markOf(part: keyof typeof parts, name: string) {
    const state = partOf(passport, part)?.states.find((entry) => entry.name === name);

    if (!state) throw new Error(`часть ${part} не объявила состояние ${name}`);

    return state.mark;
  }

  it("раскрытость приезжает словарным атрибутом на пункт и указатель", () => {
    const host = mount(scene);

    for (const part of ["item", "itemIndicator"] as const) {
      const mark = markOf(part, "open");

      if (mark.kind !== "attribute") throw new Error("раскрытость объявлена не атрибутом");
      expect(узлы(host, part)[0].getAttribute(mark.name), part).toBe(mark.value);
    }
  });

  it("СОДЕРЖИМОЕ раскрытости не объявляет — и вот почему", async () => {
    // Находка пилота, и она стоит проверки в обе стороны. Zag снимает `data-state` с
    // содержимого, когда раздел открылся без анимации (`skip = !initial && open`): у раздела,
    // открытого с самого начала, признака раскрытости на содержимом НЕТ вовсе, а после нажатия
    // человеком он появляется. Признак, которого может не быть, адресом быть не может.
    const host = mount(scene);
    const content = узлы(host, "itemContent")[0];

    expect(content.hasAttribute("hidden")).toBe(false);
    expect(content.getAttribute("data-state")).toBeNull();

    // Паспорт про это не врёт: раскрытого состояния у содержимого не объявлено, а закрытое —
    // объявлено и наблюдаемо.
    expect(partOf(passport, "itemContent")?.states.map((s) => s.name)).not.toContain("open");

    const mark = markOf("itemContent", "closed");

    if (mark.kind !== "attribute") throw new Error("закрытость объявлена не атрибутом");
    expect(узлы(host, "itemContent")[1].getAttribute(mark.name)).toBe(mark.value);

    // И вторая сторона находки — на сцене, которой человек управляет сам: раздел раскрывается
    // по-настоящему (узел перестаёт быть спрятанным), а признака раскрытости на содержимом
    // по-прежнему может не быть. Видно и без анимации: адрес был бы верен через раз.
    const живая = mount(() => <Справка />);

    нажать(узлы(живая, "itemTrigger")[0]);
    await дождаться(() => !узлы(живая, "itemContent")[0].hasAttribute("hidden"));

    expect(узлы(живая, "itemContent")[0].hasAttribute("hidden")).toBe(false);
    expect(узлы(живая, "item")[0].getAttribute("data-state")).toBe("open");
  });

  it("закрытый раздел объявленного состояния НЕ несёт", () => {
    // Обратная сторона: не будь её, скин красил бы раскрытым каждый раздел.
    const host = mount(scene);
    const mark = markOf("item", "open");

    if (mark.kind !== "attribute") throw new Error("раскрытость объявлена не атрибутом");
    expect(узлы(host, "item")[1].getAttribute(mark.name)).not.toBe(mark.value);
  });

  it("отключённость пункта — данными, отключённость кнопки — НАСТОЯЩИМ `disabled`", () => {
    // Находка пилота: Zag ставит на триггер нативный атрибут кнопки, а `data-disabled` кладёт
    // на пункт и содержимое. Объяви паспорт `data-disabled` на кнопке — правило скина было бы
    // мёртвым, и узнал бы об этом одевающий.
    const host = mount(() => (
      <Accordion>
        <AccordionItem value="закрыт" disabled>
          <AccordionItemTrigger>Закрыт</AccordionItemTrigger>
          <AccordionItemContent>нельзя</AccordionItemContent>
        </AccordionItem>
      </Accordion>
    ));

    const itemMark = markOf("item", "disabled");
    const triggerMark = markOf("itemTrigger", "disabled");

    if (itemMark.kind !== "attribute") throw new Error("отключённость пункта объявлена не атрибутом");
    if (triggerMark.kind !== "pseudo") throw new Error("отключённость кнопки объявлена не псевдоклассом");

    expect(узлы(host, "item")[0].hasAttribute(itemMark.name)).toBe(true);
    expect(узлы(host, "itemTrigger")[0].matches(triggerMark.name)).toBe(true);
  });

  it("фокус объявлен атрибутом — его знает машина, а не браузер", async () => {
    const host = mount(scene);
    const mark = markOf("item", "focus");

    if (mark.kind !== "attribute") throw new Error("фокус объявлен не атрибутом");

    const trigger = узлы(host, "itemTrigger")[0] as HTMLElement;

    expect(узлы(host, "item")[0].hasAttribute(mark.name)).toBe(false);
    trigger.focus();
    // Атрибут приезжает СЛЕДУЮЩЕЙ задачей: фокус ловит машина состояний, а не браузер, и
    // разница видна именно здесь — псевдоклассом такое состояние выразить было бы нечем.
    await nextTask();

    expect(узлы(host, "item")[0].hasAttribute(mark.name)).toBe(true);
  });

  it("объявленные псевдоклассы настоящие, а не слова", () => {
    const host = mount(scene);

    for (const part of anatomy.keys()) {
      for (const state of partOf(passport, part)?.states ?? []) {
        if (state.mark.kind !== "pseudo") continue;

        expect(state.mark.name.startsWith(":")).toBe(true);
        expect(state.mark.name.startsWith("::")).toBe(false);
        expect(() => узлы(host, part)[0].matches(state.mark.name)).not.toThrow();
      }
    }
  });
});

describe("паспорт: вложенность в два уровня", () => {
  const declared = passport.parts.map((part) => part.name);

  it("правило вложенности ссылается только на существующие части", () => {
    for (const part of passport.parts) {
      for (const allowed of part.accepts ?? []) {
        if (allowed.kind === "part") expect(declared).toContain(allowed.name);
      }
    }
  });

  it("объявленное совпадает с РАЗМЕТКОЙ: что внутри чего лежит на живом узле", () => {
    // Проверка двусторонняя, и вторая сторона важнее первой: объявить можно что угодно, а вот
    // разметка показывает, как оно на самом деле вложено.
    const host = mount(scene);

    const внутри = (part: keyof typeof parts, child: keyof typeof parts) =>
      узлы(host, part)[0].querySelector(`[data-part="${parts[child].attrs["data-part"]}"]`) !== null;

    expect(внутри("root", "item")).toBe(true);
    expect(внутри("item", "itemTrigger")).toBe(true);
    expect(внутри("item", "itemContent")).toBe(true);
    expect(внутри("itemTrigger", "itemIndicator")).toBe(true);
  });

  it("предок читается НАЗАД — по объявленному содержимому, а не отдельным полем", () => {
    // Ради этого гармошка и взята первой: у кнопки предка быть не могло, и половина адреса
    // правила скина оставалась непроверенной.
    const предки = (part: string) =>
      passport.parts
        .filter((owner) => (owner.accepts ?? []).some((a) => a.kind === "part" && a.name === part))
        .map((owner) => owner.name);

    expect(предки("item")).toEqual(["root"]);
    expect(предки("itemTrigger")).toEqual(["item"]);
    expect(предки("itemContent")).toEqual(["item"]);
    expect(предки("itemIndicator")).toEqual(["itemTrigger"]);
  });

  it("предок ЖИВОГО узла совпадает с объявленным, и его состояние видно", () => {
    const host = mount(scene);
    const координата = coordinateOf(узлы(host, "itemContent")[0], lookup);

    expect(координата?.ancestor).toEqual({
      component: "accordion",
      part: "item",
      states: ["open"],
    });
  });
});

describe("паспорт: узлы одной координаты", () => {
  it("несколько пунктов дают ОДНУ координату — покрасил один, оденутся все", () => {
    // Подтверждено средством механики (`coordinateOf`), а не сравнением на глаз: именно этим
    // средством редактор и будет решать, что человек красит не экземпляр, а часть.
    const host = mount(() => <Справка value={["доставка", "оплата"]} />);
    const координаты = узлы(host, "itemTrigger").map((node) => coordinateOf(node, lookup));

    expect(координаты.length).toBe(2);
    expect(координаты[0]).toEqual(координаты[1]);
    expect(координаты[0]?.part).toBe("itemTrigger");
  });

  it("разные состояния разводят координаты — иначе раскрытое и закрытое были бы одним адресом", () => {
    const host = mount(scene);
    const [раскрытый, закрытый] = узлы(host, "itemTrigger").map((node) => coordinateOf(node, lookup));

    expect(раскрытый?.states).toContain("open");
    expect(закрытый?.states).not.toContain("open");
  });
});

describe("паспорт: форма", () => {
  it("добавка покрывает РОВНО части анатомии — ни больше, ни меньше", () => {
    expect(passport.parts.map((part) => part.name).sort()).toEqual([...anatomy.keys()].sort());
  });

  it("имя компонента снято с анатомии, а не написано рядом", () => {
    expect(passport.component).toBe(parts[passport.root].attrs["data-scope"]);
    expect(passport.component).toBe("accordion");
  });

  it("поставщик — наша поставка, и строка совпадает с манифестом", () => {
    // Компонент приехал из Ark, а поставляем его МЫ: читатель паспорта ставит наш пакет, а не
    // чужой. Совпадение с манифестом стережёт проба — иначе строка разъехалась бы молча.
    expect(passport.package).toBe(manifest.name);
  });

  it("группа и род объявлены из закрытых перечней", () => {
    expect(passport.group).toBe("disclosure");
    expect(passport.genus).toBe("component");
  });

  it("имена состояний внутри части не повторяются", () => {
    for (const part of passport.parts) {
      const names = part.states.map((state) => state.name);

      expect(new Set(names).size).toBe(names.length);
    }
  });
});
