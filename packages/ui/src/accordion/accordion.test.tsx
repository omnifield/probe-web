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
import { addressesView } from "../passport-form.js";
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

/** Раскрыт ли узел — по словарному признаку Zag, а не по видимости. */
function раскрыт(node: Element): boolean {
  return node.getAttribute("data-state") === "open";
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

  it("у СОДЕРЖИМОГО признак раскрытости приезжает не всегда — и это НАБЛЮДАЕМО", async () => {
    // Находка пилота, и она стоит проверки в обе стороны. Zag снимает `data-state` с
    // содержимого, когда раздел открылся без анимации (`skip = !initial && open`): у раздела,
    // открытого с самого начала, признака раскрытости на содержимом НЕТ вовсе.
    const host = mount(scene);
    const content = узлы(host, "itemContent")[0];

    expect(content.hasAttribute("hidden")).toBe(false);
    expect(content.getAttribute("data-state")).toBeNull();

    const mark = markOf("itemContent", "closed");

    if (mark.kind !== "attribute") throw new Error("закрытость объявлена не атрибутом");
    expect(узлы(host, "itemContent")[1].getAttribute(mark.name)).toBe(mark.value);

    // И вторая сторона находки — на сцене, которой человек управляет сам: раздел раскрывается
    // по-настоящему, узел перестаёт быть спрятанным, признак раскрытости приезжает НА ПУНКТ — и
    // приезжает надёжно. Что в этот момент стоит на содержимом, здесь не утверждается намеренно:
    // проба, ждущая от ненадёжного признака определённого значения, ненадёжна ровно так же — она
    // и покраснела на первом же повторе прогона. Ненадёжность проверяется объявлением (проба
    // ниже), а не попыткой её воспроизвести.
    const живая = mount(() => <Справка />);

    нажать(узлы(живая, "itemTrigger")[0]);
    await дождаться(() => !узлы(живая, "itemContent")[0].hasAttribute("hidden"));

    expect(узлы(живая, "itemContent")[0].hasAttribute("hidden")).toBe(false);
    expect(узлы(живая, "item")[0].getAttribute("data-state")).toBe("open");
  });

  it("раскрытость СОДЕРЖИМОГО объявлена — с машиночитаемой пометкой «признак приезжает не всегда»", () => {
    // `PWEB-97`. Прежде паспорт о состоянии молчал, и молчание решало за обоих читателей сразу:
    // виду — верно, движению — нет. Теперь состояние объявлено, а ненадёжность признака названа
    // полем, а не комментарием: комментарий машина не прочтёт, а решать по нему обязаны двое.
    const состояние = partOf(passport, "itemContent")?.states.find((s) => s.name === "open");

    if (!состояние) throw new Error("содержимое не объявило раскрытости");

    // Признак — тот же словарный атрибут, что у пункта: состояние ОДНО, ненадёжен только его
    // приход. Разъедься признаки — движение целилось бы не туда, куда смотрит вид.
    expect(состояние.mark).toEqual(markOf("item", "open"));
    expect(состояние.absentWhen).toBeTruthy();
    expect(addressesView(состояние)).toBe(false);

    // Оговорка ровно у содержимого. Пункт и указатель раскрытость держат надёжно, и приписать
    // её им значило бы соврать в обратную сторону — вид перестал бы адресовать раскрытый пункт.
    for (const part of ["item", "itemIndicator"] as const) {
      const надёжное = partOf(passport, part)?.states.find((s) => s.name === "open");

      expect(надёжное?.absentWhen, part).toBeUndefined();
      expect(надёжное && addressesView(надёжное), part).toBe(true);
    }
  });

  it("ВИД такого состояния не адресует — даже когда признак на узле есть", () => {
    // Половина, ради которой пометка машиночитаема. Мост под вид отбрасывает состояние по
    // ОБЪЯВЛЕНИЮ, а не по тому, видно ли признак сейчас: отсеивай он по наличию — координата
    // содержала бы `open` ровно в те моменты, когда признак приехал, и правило выглядело бы
    // рабочим у того, кто его написал.
    const host = mount(scene);
    const content = узлы(host, "itemContent")[0];

    content.setAttribute("data-state", "open");

    expect(coordinateOf(content, lookup)?.states).not.toContain("open");
    // Закрытое состояние того же атрибута читателем не потеряно — отброшено именно ненадёжное.
    expect(coordinateOf(узлы(host, "itemContent")[1], lookup)?.states).toContain("closed");
    // А раскрытый ВИД содержимого адресуется через предка, как и было решено: у пункта признак
    // приезжает всегда.
    expect(coordinateOf(content, lookup)?.ancestor?.states).toContain("open");
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

// НАСТРОЙКИ — чем гармошка может быть (`PWEB-89`).
//
// Ключи объявления сверены с пропами компонента ТИПОМ (`defineSettings<AccordionProps>`):
// настройка, которой у гармошки нет, не наберётся, а настройка, которая есть и не объявлена, —
// недостача обязательного ключа. Обе половины проверены мутациями и записаны в README.
//
// Здесь проверяется вторая сторона, которую тип не видит: что объявленное НАБЛЮДАЕМО на живом
// компоненте. Правило паспорта одно на всё, что в нём записано, и настроек оно тоже касается:
// объявить настройку, которая ничего не меняет, значило бы соврать данными.
describe("паспорт: настройки наблюдаемы на живом компоненте", () => {
  it("объявлены ровно те, что приняты формой, и каждая с умолчанием", () => {
    // Умолчание обязательно по той же причине, что у оси вариаций: без него «горизонтальная» и
    // «не указано» окажутся разными положениями, совпадающими по договорённости.
    for (const [name, setting] of Object.entries(passport.settings)) {
      expect(setting.means.length, `настройка «${name}» без объяснения`).toBeGreaterThan(0);
      expect(setting.byDefault, `настройка «${name}» без умолчания`).toBeDefined();
    }

    expect(Object.keys(passport.settings).sort()).toEqual(["collapsible", "multiple", "orientation"]);
  });

  it("`orientation` меняет РАЗМЕТКУ: положение доезжает до узлов признаком", () => {
    const умолчание = mount(() => <Справка value={["доставка"]} />);

    expect(умолчание.querySelector("[data-orientation]")?.getAttribute("data-orientation")).toBe(
      passport.settings.orientation!.byDefault,
    );

    cleanup();

    const боком = mount(() => (
      <Accordion orientation="horizontal" value={["доставка"]}>
        <AccordionItem value="доставка">
          <AccordionItemTrigger>Доставка</AccordionItemTrigger>
          <AccordionItemContent>Курьером</AccordionItemContent>
        </AccordionItem>
      </Accordion>
    ));

    expect(боком.querySelector("[data-orientation]")?.getAttribute("data-orientation")).toBe(
      "horizontal",
    );
  });

  it("`multiple` меняет ПОВЕДЕНИЕ: без неё раскрыт один раздел, с ней — два", async () => {
    const одиночная = mount(() => (
      <Accordion defaultValue={["доставка"]}>
        <AccordionItem value="доставка">
          <AccordionItemTrigger>Доставка</AccordionItemTrigger>
          <AccordionItemContent>Курьером</AccordionItemContent>
        </AccordionItem>
        <AccordionItem value="оплата">
          <AccordionItemTrigger>Оплата</AccordionItemTrigger>
          <AccordionItemContent>Картой</AccordionItemContent>
        </AccordionItem>
      </Accordion>
    ));

    нажать(узлы(одиночная, "itemTrigger")[1]!);
    await дождаться(() => узлы(одиночная, "item")[1]!.getAttribute("data-state") === "open");

    // Умолчание — `false`: раскрытие второго ЗАКРЫВАЕТ первый. Проверяется не число раскрытых, а
    // ПЕРЕКЛЮЧЕНИЕ: одно число зелено и тогда, когда нажатие вообще не дошло до машины, — ловушка
    // проб на Ark, разобранная в шапке файла.
    expect(passport.settings.multiple!.byDefault).toBe(false);
    expect(узлы(одиночная, "item").filter(раскрыт).map((node) => node.getAttribute("data-part"))).toEqual(
      ["item"],
    );
    expect(раскрыт(узлы(одиночная, "item")[1]!)).toBe(true);
    expect(раскрыт(узлы(одиночная, "item")[0]!)).toBe(false);

    cleanup();

    const множественная = mount(() => <Справка value={["доставка", "оплата"]} />);

    expect(узлы(множественная, "item").filter(раскрыт).length).toBe(2);
  });

  it("`collapsible` меняет ПОВЕДЕНИЕ: без неё последний раскрытый не закрывается", async () => {
    // Пара, а не одна сцена: ОДНО И ТО ЖЕ нажатие даёт разный исход. Проверь мы только «остался
    // раскрыт», проба была бы зелена и на нажатии, не дошедшем до машины; второй половиной
    // доказано, что нажатие доходит.
    const обычная = mount(() => (
      <Accordion defaultValue={["доставка"]}>
        <AccordionItem value="доставка">
          <AccordionItemTrigger>Доставка</AccordionItemTrigger>
          <AccordionItemContent>Курьером</AccordionItemContent>
        </AccordionItem>
      </Accordion>
    ));

    нажать(узлы(обычная, "itemTrigger")[0]!);
    await дождаться(() => узлы(обычная, "item").filter(раскрыт).length === 0);

    expect(passport.settings.collapsible!.byDefault).toBe(false);
    expect(узлы(обычная, "item").filter(раскрыт).length).toBe(1);

    cleanup();

    const закрываемая = mount(() => (
      <Accordion collapsible defaultValue={["доставка"]}>
        <AccordionItem value="доставка">
          <AccordionItemTrigger>Доставка</AccordionItemTrigger>
          <AccordionItemContent>Курьером</AccordionItemContent>
        </AccordionItem>
      </Accordion>
    ));

    нажать(узлы(закрываемая, "itemTrigger")[0]!);
    await дождаться(() => узлы(закрываемая, "item").filter(раскрыт).length === 0);

    expect(узлы(закрываемая, "item").filter(раскрыт).length).toBe(0);
  });
});
