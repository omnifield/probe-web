// Пробы кнопки — поведение И паспорт, рядом с самим компонентом (`PWEB-2`).
//
// Компонент это не только разметка, а набор: разметка, анатомия, пробы. Пока они лежали по
// параллельным папкам, «что такое кнопка» приходилось собирать в голове по четырём адресам, а
// увидеть, чего компоненту не хватает, было нельзя вовсе. Теперь неполнота видна в дереве.
//
// ГЛАВНОЕ ПРАВИЛО ПАСПОРТА: он не объявляет ненаблюдаемого. Всё записанное в
// `button.anatomy.ts` проверяется здесь на ЖИВОМ компоненте — поставили в разметку, посмотрели.
// Поэтому проверка двусторонняя:
//
//   1. объявленная часть появляется в разметке с адресными атрибутами ИЗ АНАТОМИИ;
//   2. адресный атрибут, найденный в разметке, есть в анатомии.
//
// Односторонней такой пробе быть нельзя: первая сторона ловит обещание без узла (правило скина
// есть, цеплять нечего), вторая — узел без обещания (часть останется голой при полностью
// «одетом» компоненте).

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it, vi } from "vitest";

import { cleanup, mount, one } from "../../test/dom.jsx";
import { admits, GROUPS, groupOf } from "../passport-form.js";
import { Popover, PopoverTrigger } from "../popover.jsx";
import { Toggle } from "../toggle.jsx";
import { anatomy, parts, passport } from "./button.anatomy.js";
import { Button } from "./button.jsx";

afterEach(cleanup);

const here = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(
  readFileSync(resolve(here, "..", "..", "package.json"), "utf8"),
) as { name: string };

/** Сцена, в которой видны ВСЕ части компонента разом. У кнопки часть одна. */
const scene = () => <Button>Отправить</Button>;

/** Адресные атрибуты, реально доехавшие до узлов: `data-part` вместе со своим `data-scope`. */
function addressesInDocument(host: ParentNode): Array<{ scope: string; part: string }> {
  return [...host.querySelectorAll("[data-part]")].map((node) => ({
    scope: node.getAttribute("data-scope") ?? "",
    part: node.getAttribute("data-part") ?? "",
  }));
}

describe("Button", () => {
  it("рендерит ОДИН узел `<button>` и ничего вокруг", () => {
    const host = mount(() => <Button>Сохранить</Button>);

    expect(host.children.length).toBe(1);
    expect(host.firstElementChild?.tagName).toBe("BUTTON");
    expect(host.textContent).toBe("Сохранить");
  });

  it("ставит `type=button` — кнопка в форме не отправляет её нажатием", () => {
    const host = mount(() => <Button>Показать</Button>);

    expect(one<HTMLButtonElement>(host, "button").type).toBe("button");
  });

  it("`type` потребителя выигрывает — кнопку отправки собрать можно", () => {
    const host = mount(() => <Button type="submit">Отправить</Button>);

    expect(one<HTMLButtonElement>(host, "button").type).toBe("submit");
  });

  it("отключённая кнопка несёт и нативный `disabled`, и `data-disabled`", () => {
    const host = mount(() => <Button disabled>Нельзя</Button>);
    const node = one<HTMLButtonElement>(host, "button");

    expect(node.disabled).toBe(true);
    // `data-disabled` — зацепка для CSS: у отключённой кнопки нет ни `:hover`, ни своего
    // класса, и без атрибута состояние снаружи не видно.
    expect(node.hasAttribute("data-disabled")).toBe(true);
  });

  it("отключённая кнопка не зовёт обработчик", () => {
    const onClick = vi.fn();
    const host = mount(() => (
      <Button disabled onClick={onClick}>
        Нельзя
      </Button>
    ));

    one<HTMLButtonElement>(host, "button").click();

    expect(onClick).not.toHaveBeenCalled();
  });

  it("при `as='a'` остаётся ссылкой — без подмены роли", () => {
    const host = mount(() => (
      <Button as="a" href="/docs">
        Документация
      </Button>
    ));
    const node = one<HTMLAnchorElement>(host, "a");

    expect(host.children.length).toBe(1);
    expect(node.getAttribute("href")).toBe("/docs");
    // У `<a href>` роль ссылки уже есть; `role="button"` тут был бы враньём скринридеру.
    expect(node.hasAttribute("role")).toBe(false);
    expect(node.hasAttribute("type")).toBe(false);
  });

  it("при `as='div'` дописывает роль и фокусируемость, которых у div нет", () => {
    const host = mount(() => <Button as="div">Псевдокнопка</Button>);
    const node = one(host, "div");

    expect(node.getAttribute("role")).toBe("button");
    expect(node.getAttribute("tabindex")).toBe("0");
  });

  it("отключённая НЕнативная кнопка объявляет это через `aria-disabled`", () => {
    const host = mount(() => (
      <Button as="div" disabled>
        Нельзя
      </Button>
    ));
    const node = one(host, "div");

    // У `<div>` нет атрибута `disabled` — без `aria-disabled` состояние не озвучивается.
    expect(node.getAttribute("aria-disabled")).toBe("true");
    expect(node.hasAttribute("data-disabled")).toBe(true);
  });

  it("несёт зацепку `data-slot=button` по умолчанию", () => {
    // Обязательство зоны по именам слотов (`PROBEWEB-12`, п.7) переезд на анатомию не
    // отменяет: снятие имени — мажор и решение architect, а не следствие правки кита.
    const host = mount(() => <Button>Ок</Button>);

    expect(one(host, "button").getAttribute("data-slot")).toBe("button");
  });

  it("состояние загрузки собирается из готового, без пропа-сахара", () => {
    // Проверяем ровно то, что обещано в доке компонента: сборка из `disabled` + `aria-busy`
    // + вложенного индикатора даёт то же, ради чего в оракуле был проп `loading`.
    const host = mount(() => (
      <Button disabled aria-busy="true">
        <span data-testid="индикатор" />
      </Button>
    ));
    const node = one<HTMLButtonElement>(host, "button");

    expect(node.disabled).toBe(true);
    expect(node.getAttribute("aria-busy")).toBe("true");
    expect(node.querySelector('[data-testid="индикатор"]')).not.toBeNull();
  });
});

describe("паспорт: часть ↔ разметка", () => {
  it("каждая часть анатомии появляется в документе — её же атрибутами", () => {
    const host = mount(scene);

    expect(anatomy.keys().length).toBeGreaterThan(0);

    for (const part of anatomy.keys()) {
      const { attrs } = parts[part];
      const node = one(
        host,
        `[data-scope="${attrs["data-scope"]}"][data-part="${attrs["data-part"]}"]`,
      );

      // Именно `attrs` из анатомии, а не похожие атрибуты: скин цепляется селектором из того
      // же объявления, и совпадать они обязаны посимвольно.
      for (const [name, value] of Object.entries(attrs)) {
        expect(node.getAttribute(name)).toBe(value);
      }
    }
  });

  it("каждый адресный атрибут из разметки объявлен анатомией", () => {
    const host = mount(scene);
    const found = addressesInDocument(host);
    const declared = anatomy.keys().map((part) => parts[part].attrs);

    // Обратная сторона: узел, подписанный адресом, которого нет в анатомии, скину не виден —
    // он останется голым при полностью «одетом» компоненте.
    expect(found.length).toBe(declared.length);

    for (const address of found) {
      expect(declared).toContainEqual({
        "data-scope": address.scope,
        "data-part": address.part,
      });
    }
  });

  it("селектор части находит узел — иначе правило скина мёртвое", () => {
    const host = mount(scene);

    for (const part of anatomy.keys()) {
      // `selector` анатомии написан для вложенности (`&[…], & […]`) — берём ту его половину,
      // которая адресует сам узел. Неразбираемый селектор уронил бы `matches`.
      const own = parts[part].selector.split(",")[0].replace("&", "").trim();

      expect(() => one(host, own)).not.toThrow();
    }
  });
});

describe("паспорт: состояния", () => {
  const states = passport.parts.flatMap((part) =>
    part.states.map((state) => ({ part: part.name, ...state })),
  );

  it("словарь не пуст — иначе скину нечего одевать, кроме покоя", () => {
    expect(states.length).toBeGreaterThan(0);
  });

  it.each(states.filter((state) => state.mark.kind === "pseudo"))(
    "`$name` — настоящий псевдокласс, а не слово",
    (state) => {
      const name = state.mark.kind === "pseudo" ? state.mark.name : "";
      const host = mount(scene);
      const node = one(host, `[data-part="${parts[state.part].attrs["data-part"]}"]`);

      // Псевдоэлемент — не состояние: `::before` рисует УЗЕЛ, которого нет в разметке, и
      // адресовать его как состояние части значило бы обещать несуществующее место.
      expect(name.startsWith(":")).toBe(true);
      expect(name.startsWith("::")).toBe(false);

      // Выдуманный псевдокласс роняет разбор селектора — ровно то, что нужно: скин порождает
      // селектор из адреса, и неразбираемый селектор стал бы мёртвым правилом.
      expect(() => node.matches(name)).not.toThrow();
    },
  );

  /** Объявленная разметка состояния — то, за что зацепится скин. */
  function markOf(name: string): { name: string; value?: string } {
    const state = states.find((entry) => entry.name === name);
    if (!state || state.mark.kind !== "attribute") {
      throw new Error(`состояние ${name} объявлено не атрибутом — проба смотрит не туда`);
    }

    return { name: state.mark.name, value: state.mark.value };
  }

  it("`disabled` — кнопка САМА показывает его тем атрибутом, что объявлен", () => {
    const mark = markOf("disabled");
    const host = mount(() => <Button disabled>Нельзя</Button>);

    expect(one(host, "button").hasAttribute(mark.name)).toBe(true);

    // И обратная сторона: у обычной кнопки атрибута быть не должно — иначе состояние
    // «отключена» стояло бы всегда, и скин красил бы серым живую кнопку.
    const idle = mount(() => <Button>Можно</Button>);

    expect(one(idle, "button").hasAttribute(mark.name)).toBe(false);
  });

  it("`busy` — атрибут ставит потребитель, и он доезжает как объявлено", () => {
    // Пропа-сахара `loading` в ките нет намеренно: занятая кнопка собирается из готового.
    // Паспорт поэтому называет ЧЕМ выражено состояние — иначе договориться об этом негде, и
    // скин не смог бы одеть занятую кнопку вовсе.
    const mark = markOf("busy");
    const host = mount(() => (
      <Button disabled {...{ [mark.name]: mark.value }}>
        Отправляем
      </Button>
    ));

    expect(one(host, "button").getAttribute(mark.name)).toBe(mark.value);
  });

  it("`expanded` — приходит от окна при композиции, и приходит тем атрибутом, что объявлен", () => {
    // Состояние кнопке не принадлежит: раскрытость это поведение окна. Но показывать её обязан
    // ВИД — на узле, который выглядит кнопкой, — значит паспорт кнопки её называет (`PWEB-25`).
    // Проба идёт через живую композицию: объявить состояние, которого никто не ставит, легко.
    const mark = markOf("expanded");
    const host = mount(() => (
      <Popover open>
        <PopoverTrigger as={Button}>Настройки</PopoverTrigger>
      </Popover>
    ));

    expect(one(host, "button").hasAttribute(mark.name)).toBe(true);

    // И обратная сторона: у кнопки, которая ничем не управляет, состояния нет — иначе скин
    // красил бы раскрытой каждую кнопку.
    const idle = mount(scene);

    expect(one(idle, "button").hasAttribute(mark.name)).toBe(false);
  });

  it("`pressed` — приходит от переключателя, вид при этом кнопкин", () => {
    const mark = markOf("pressed");
    const host = mount(() => (
      <Toggle as={Button} pressed>
        Жирный
      </Toggle>
    ));

    expect(one(host, "button").hasAttribute(mark.name)).toBe(true);

    const idle = mount(scene);

    expect(one(idle, "button").hasAttribute(mark.name)).toBe(false);
  });
});

describe("паспорт: ось вариаций", () => {
  it("ось выражена ОДНИМ атрибутом и имён не называет", () => {
    const { mark } = passport.variantAxis;

    expect(mark.kind).toBe("attribute");
    // Значения у оси нет намеренно: значение — это ИМЯ вариации, а имена создаёт человек в
    // редакторе вместе со скином. Объяви кит хоть одно — паспорт объявил бы ненаблюдаемое.
    expect(mark.kind === "attribute" && mark.value).toBeUndefined();
  });

  it("имя, которого кит не знает, доезжает до узла", () => {
    const { mark } = passport.variantAxis;
    // Имя нарочно произвольное и человеческое: кит не должен знать НИ ОДНОГО имени вариации,
    // и проверяется здесь прозрачность кита, а не существование вариации.
    const host = mount(() => <Button {...{ [mark.name]: "главная" }}>Сохранить</Button>);

    expect(one(host, "button").getAttribute(mark.name)).toBe("главная");
  });

  it("голая кнопка атрибут оси не несёт — умолчание называет скин, а не кит", () => {
    const host = mount(scene);

    expect(one(host, "button").hasAttribute(passport.variantAxis.mark.name)).toBe(false);
  });
});

describe("паспорт: что допустимо внутри", () => {
  // Кнопка пускает внутрь подпись и значок — и это записано РОДОМ, а не именами компонентов
  // (`PWEB-24`). Проба сторожит обе стороны: объявленное действительно доезжает до живого узла,
  // а необъявленное машина отвергает.
  //
  // Честный предел: отвергает РЕДАКТОР, а не DOM. Положить в `<button>` можно что угодно, и
  // проверить отказ на узле нельзя в принципе — правило вложенности это обещание тому, кто
  // собирает дерево. Поэтому здесь спрашивается `admits`, а не разметка.
  const root = passport.parts.find((part) => part.name === passport.root);

  if (!root) throw new Error("у кнопки нет добавки на корневую часть");

  it("объявляет допустимым текст и значок — и ничего сверх того", () => {
    expect(admits(root, { kind: "content", genus: "text" })).toBe(true);
    expect(admits(root, { kind: "content", genus: "icon" })).toBe(true);
  });

  it("отвергает компонент — раскладке внутри кнопки места нет", () => {
    // Род кандидата берётся из ЕГО паспорта. Здесь это паспорт самой кнопки: кнопка в кнопке —
    // ровно то вложение, которое обязано отвергаться, и второй компонент для проверки не нужен.
    expect(admits(root, { kind: "content", genus: passport.genus })).toBe(false);
  });

  it("объявленное доезжает до живого узла: подпись и значок видны внутри кнопки", () => {
    const host = mount(() => (
      <Button>
        <svg data-проба="значок" />
        Сохранить
      </Button>
    ));
    const node = one(host, "button");

    expect(node.textContent).toBe("Сохранить");
    expect(node.querySelector("[data-проба='значок']")).not.toBeNull();
  });

  it("род компонента объявлен — иначе кандидата опознавали бы по имени пакета", () => {
    expect(passport.genus).toBe("component");
  });
});

describe("паспорт: форма", () => {
  const declared = passport.parts.map((part) => part.name);

  it("добавка покрывает РОВНО части анатомии — ни больше, ни меньше", () => {
    // Часть анатомии без добавки не имеет ни состояний, ни назначения: редактору нечего
    // показать. Добавка без части анатомии адресует то, чего в разметке нет.
    expect([...declared].sort()).toEqual([...anatomy.keys()].sort());
  });

  it("корень назван и есть среди частей", () => {
    expect(anatomy.keys()).toContain(passport.root);
  });

  it("имя компонента снято с анатомии, а не написано рядом", () => {
    expect(passport.component).toBe(parts[passport.root].attrs["data-scope"]);
  });

  it("правило вложенности ссылается на существующие части", () => {
    for (const part of passport.parts) {
      for (const allowed of part.accepts ?? []) {
        if (allowed.kind === "part") expect(declared).toContain(allowed.name);
      }
    }
  });

  it("имена состояний внутри части не повторяются", () => {
    // Повтор ломает адресацию молча: правило скина цепляется за имя, а какое из двух
    // состояний имелось в виду — неизвестно.
    for (const part of passport.parts) {
      const names = part.states.map((state) => state.name);

      expect(new Set(names).size).toBe(names.length);
    }
  });

  it("группа объявлена и взята из закрытого перечня", () => {
    // Место в перечне называет ПОСТАВЩИК (`PWEB-34`): не назови его кнопка — раздел придумал бы
    // каждый пульт сам, и витрина с редактором разошлись бы на первом же десятке компонентов.
    expect(passport.group).toBe("actions");
    expect(Object.keys(GROUPS)).toContain(passport.group);
    expect(groupOf(passport)).toBe("actions");
  });

  it("поставщик назван и совпадает с манифестом", () => {
    // Форма одна на всех поставщиков, поэтому читатель обязан узнать поставщика ДАННЫМИ, не
    // зная имён пакетов заранее. Строка написана в паспорте руками — сверяем с манифестом,
    // иначе она разъедется с ним молча.
    expect(passport.package).toBe(manifest.name);
  });
});
