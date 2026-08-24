// Гейт МОСТА «узел → координата» (`PWEB-27`, средство 1).
//
// Механика сборки адресует узлы, скин — координаты. Проба стережёт превращение одного в другое,
// и делает это на ЖИВОМ документе: координата, снятая с придуманного объекта, ничего не сказала
// бы о том, доедет ли объявленное состояние до настоящего узла.
//
// Две вещи проверяются отдельно и обе обязательны:
//
//   1. по узлу кита координата снимается целиком — часть, состояния, вариация, предок;
//   2. читатель НЕ прибит к киту: паспорт он находит переданной функцией, и компонент чужого
//      поставщика адресуется тем же вызовом. Форма паспорта одна на всех, и мост обязан быть
//      таким же — иначе продуктовый пакет со своей таблицей окажется не адресуем вовсе.
//
// Честный предел: положительный псевдокласс здесь не воспроизводится. `:hover` и `:active`
// ставит браузер по указателю, JSDOM их не знает — проверяется поэтому обратная сторона (в
// покое их в координате нет), а положительная половина остаётся за живым браузером.

import { createAnatomy } from "@zag-js/anatomy";
import { afterEach, describe, expect, it } from "vitest";

import { Button } from "../src/button/index.js";
import { passport as buttonPassport } from "../src/button/button.anatomy.js";
import { definePassport } from "../src/passport-form.js";
import { coordinateOf, partOf, type PassportLookup } from "../src/passport-view.js";
import { Popover, PopoverTrigger } from "../src/popover.jsx";
import { cleanup, mount, one } from "./dom.jsx";

afterEach(cleanup);

/** Читатель кита: паспорт есть у кнопки, у остального — нет, и это честно. */
const kit: PassportLookup = (component) =>
  component === buttonPassport.component ? buttonPassport : undefined;

// Чужой поставщик — компонент, которого в ките нет и не будет. Часть названа ВЕРБЛЮДОМ
// намеренно: в атрибут она уезжает через дефис, и обратное преобразование обязан делать не мост
// вручную, а сама анатомия.
const списокAnatomy = createAnatomy("список").parts("root", "itemTrigger");
const списокParts = списокAnatomy.build();
const списокPassport = definePassport({
  anatomy: списокAnatomy,
  package: "@чужой/пакет",
  genus: "component",
  root: "root",
  settings: {},
  parts: [
    {
      name: "root",
      means: "список целиком",
      states: [],
      accepts: [{ kind: "part", name: "itemTrigger" }],
    },
    {
      name: "itemTrigger",
      means: "заголовок пункта, по которому нажимают",
      states: [
        { name: "expanded", means: "пункт раскрыт", mark: { kind: "attribute", name: "data-expanded" } },
      ],
      accepts: [{ kind: "content", genus: "text" }],
    },
  ],
  variantAxis: { means: "имя вариации", mark: { kind: "attribute", name: "data-variant" } },
});

/** Читатель редактора: и кит, и чужой поставщик — одной функцией, как оно и будет в редакторе. */
const registry: PassportLookup = (component) =>
  component === списокPassport.component ? списокPassport : kit(component);

/** Узел чужого поставщика — руками, потому что компонента у нас нет, а адрес у него настоящий. */
function узелСписка(part: keyof typeof списокParts, ...attrs: Array<[string, string]>): Element {
  const node = document.createElement("div");

  for (const [name, value] of Object.entries(списокParts[part].attrs)) node.setAttribute(name, value);
  for (const [name, value] of attrs) node.setAttribute(name, value);

  return node;
}

describe("координата по узлу кита", () => {
  it("голая кнопка даёт компонент и часть, и больше ничего", () => {
    const host = mount(() => <Button>Сохранить</Button>);

    expect(coordinateOf(one(host, "button"), kit)).toEqual({
      component: "button",
      part: "root",
      states: [],
    });
  });

  it("состояние узла попадает в координату — тем именем, которым его объявил паспорт", () => {
    const host = mount(() => (
      <Button disabled aria-busy="true">
        Отправляем
      </Button>
    ));

    // Имена, а не атрибуты: адрес правила скина состоит из имён состояний, и разметка за ними
    // вправе поменяться (у Zag то же выражено иначе), не двигая ни одного сохранённого скина.
    expect(coordinateOf(one(host, "button"), kit)?.states).toEqual(["disabled", "busy"]);
  });

  it("состояний в координате бывает НЕСКОЛЬКО — выбор за редактором, не за мостом", () => {
    const host = mount(() => (
      <Popover open>
        <PopoverTrigger as={Button} disabled>
          Настройки
        </PopoverTrigger>
      </Popover>
    ));

    // Заодно видно, что мост согласован с решением по композиции (`PWEB-25`): адрес у
    // внутреннего компонента, состояние пришло от внешнего, и в координате они вместе.
    const координата = coordinateOf(one(host, "button"), kit);

    expect(координата?.component).toBe("button");
    expect(координата?.states).toContain("expanded");
    expect(координата?.states).toContain("disabled");
  });

  it("псевдоклассов у покоящегося узла в координате нет", () => {
    const host = mount(() => <Button>Сохранить</Button>);

    expect(coordinateOf(one(host, "button"), kit)?.states).not.toContain("hover");
  });

  it("имя вариации снимается с узла — кит его не знает, а мост отдаёт как есть", () => {
    const host = mount(() => <Button data-variant="главная">Сохранить</Button>);

    expect(coordinateOf(one(host, "button"), kit)?.variant).toBe("главная");
  });

  it("вариации нет — поля нет: пустая строка стала бы вторым именем умолчания", () => {
    const host = mount(() => <Button>Сохранить</Button>);

    expect(coordinateOf(one(host, "button"), kit)).not.toHaveProperty("variant");
  });
});

describe("узлы, которых скину не достанется", () => {
  it("содержимое потребителя координаты не имеет", () => {
    // Ровно то, ради чего мост отвечает `undefined`, а не «что-нибудь»: редактор не должен
    // предлагать одеть узел, до которого скин не дотянется никогда.
    const host = mount(() => (
      <Button>
        <span data-проба="подпись">Сохранить</span>
      </Button>
    ));

    expect(coordinateOf(one(host, "[data-проба]"), kit)).toBeUndefined();
  });

  it("компонент без паспорта не адресуем — заглушки не выдумывается", () => {
    const host = mount(() => <Button>Сохранить</Button>);
    const node = one(host, "button");

    expect(coordinateOf(node, () => undefined)).toBeUndefined();
  });

  it("узел с адресом чужой части не адресуем — часть обязана быть в анатомии", () => {
    const host = mount(() => <Button>Сохранить</Button>);
    const node = one(host, "button");

    node.setAttribute("data-part", "такой-части-нет");

    expect(coordinateOf(node, kit)).toBeUndefined();
  });
});

describe("предок — часть-владелец и её состояние", () => {
  it("снимается с ближайшего адресуемого узла над выбранным", () => {
    const пункт = узелСписка("itemTrigger", ["data-expanded", ""]);
    const обёртка = document.createElement("span");
    const host = mount(() => <Button>Сохранить</Button>);

    // Между предком и узлом нарочно стоит НЕадресуемая обёртка: разметка компонента — его
    // внутреннее дело, и мост обязан подниматься до ближайшего адреса, а не до родителя.
    пункт.append(обёртка);
    обёртка.append(one(host, "button"));
    document.body.append(пункт);

    expect(coordinateOf(one(пункт, "button"), registry)?.ancestor).toEqual({
      component: "список",
      part: "itemTrigger",
      states: ["expanded"],
    });

    пункт.remove();
  });

  it("предка нет — поля нет, а не пустой предок", () => {
    const host = mount(() => <Button>Сохранить</Button>);

    expect(coordinateOf(one(host, "button"), kit)).not.toHaveProperty("ancestor");
  });
});

describe("читатель не прибит к киту", () => {
  it("компонент чужого поставщика адресуется тем же вызовом", () => {
    const node = узелСписка("itemTrigger", ["data-variant", "крупный"]);

    expect(coordinateOf(node, registry)).toEqual({
      component: "список",
      part: "itemTrigger",
      states: [],
      variant: "крупный",
    });
  });

  it("часть возвращается КЛЮЧОМ анатомии, а не начертанием из атрибута", () => {
    // `itemTrigger` уезжает в разметку как `item-trigger`, и обратно его переводит сама
    // анатомия. Напиши мост это правило второй раз — оно разошлось бы с первым в тот день,
    // когда пакет его поменяет.
    const node = узелСписка("itemTrigger");

    expect(node.getAttribute("data-part")).toBe("item-trigger");
    expect(coordinateOf(node, registry)?.part).toBe("itemTrigger");
  });

  it("часть паспорта достаётся по имени — вместе с назначением и словарём состояний", () => {
    const часть = partOf(списокPassport, "itemTrigger");

    expect(часть?.means).toBe("заголовок пункта, по которому нажимают");
    expect(часть?.states.map((state) => state.name)).toEqual(["expanded"]);
    expect(partOf(списокPassport, "такой-части-нет")).toBeUndefined();
  });
});

// Ненадёжный признак у ЧУЖОГО поставщика (`PWEB-97`): гармошка — не привилегия, и мост обязан
// отбрасывать такое состояние у любого, кто его объявил. Своя анатомия здесь потому, что список
// выше проверяется на точный словарь состояний, а предмет этой пробы — второе состояние рядом с
// надёжным: только на паре видно, что отброшено ровно одно.
const шторкаAnatomy = createAnatomy("шторка").parts("root");
const шторкаParts = шторкаAnatomy.build();
const шторкаPassport = definePassport({
  anatomy: шторкаAnatomy,
  package: "@чужой/пакет",
  genus: "component",
  root: "root",
  settings: {},
  parts: [
    {
      name: "root",
      means: "шторка целиком",
      states: [
        {
          name: "open",
          means: "шторка раскрыта",
          mark: { kind: "attribute", name: "data-state", value: "open" },
          absentWhen: "раскрытие прошло без анимации — поставщик снимает признак целиком",
        },
        { name: "disabled", means: "шторку не двигают", mark: { kind: "attribute", name: "data-disabled" } },
      ],
    },
  ],
  variantAxis: { means: "имя вариации", mark: { kind: "attribute", name: "data-variant" } },
});

const сРаскрывашкой = (component: string) =>
  component === шторкаPassport.component ? шторкаPassport : undefined;

/** Узел шторки со всеми признаками сразу — и надёжным, и ненадёжным. */
function узелШторки(...attrs: Array<[string, string]>): Element {
  const node = document.createElement("div");

  for (const [name, value] of Object.entries(шторкаParts.root.attrs)) node.setAttribute(name, value);
  for (const [name, value] of attrs) node.setAttribute(name, value);

  return node;
}

describe("состояние, чей признак приезжает не всегда, адресом ВИДА не становится", () => {
  it("признак на узле есть, а в координате состояния нет — решает объявление", () => {
    // Самая важная половина. Отсеивай мост по наличию признака — состояние попадало бы в
    // координату ровно в те моменты, когда признак приехал, и правило выглядело бы рабочим у
    // того, кто его написал, а молчало бы у всех остальных.
    const node = узелШторки(["data-state", "open"], ["data-disabled", ""]);

    expect(node.getAttribute("data-state")).toBe("open");
    expect(coordinateOf(node, сРаскрывашкой)?.states).toEqual(["disabled"]);
  });

  it("предок с таким состоянием тоже его не отдаёт — правило у моста одно на оба места", () => {
    // Предок читается тем же средством, и написать для него второе правило значило бы завести
    // расхождение внутри одного файла.
    const предок = узелШторки(["data-state", "open"]);
    const host = mount(() => <Button>Сохранить</Button>);

    предок.append(one(host, "button"));
    document.body.append(предок);

    expect(coordinateOf(one(предок, "button"), (c) => сРаскрывашкой(c) ?? kit(c))?.ancestor).toEqual({
      component: "шторка",
      part: "root",
      states: [],
    });

    предок.remove();
  });
});
