// Пробы значка — поведение И паспорт, рядом с самим компонентом (`PWEB-107`).
//
// ГЛАВНОЕ ПРАВИЛО ПАСПОРТА: он не объявляет ненаблюдаемого. Записанное в `icon.anatomy.ts`
// проверяется здесь на ЖИВОМ узле.
//
// Значки — точечно, тем же приёмом, что предписывает ticket и подтверждает
// `test/surface.test.ts` («не тянет `lucide-solid` в бандл поставки»): `lucide-solid/icons/…`,
// а не корневой баррель.

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import ArrowRight from "lucide-solid/icons/arrow-right";
import ChevronDown from "lucide-solid/icons/chevron-down";
import type { LucideProps } from "lucide-solid";
import { createSignal, type Component } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import { cleanup, mount, one } from "../../test/dom.jsx";
import { admits, groupOf, type PassportGenus } from "../passport-form.js";
import { coordinateOf, type PassportLookup } from "../passport-view.js";
import { anatomy, parts, passport } from "./icon.anatomy.js";
import { Icon } from "./icon.jsx";

afterEach(cleanup);

const here = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(
  readFileSync(resolve(here, "..", "..", "package.json"), "utf8"),
) as { name: string };

/** Кандидат-содержимое названного рода — тот же приём, что в `test/passport-form.test.ts`. */
const content = (genus: PassportGenus) => ({ kind: "content", genus }) as const;

/** Читатель паспорта — им же будет пользоваться редактор. */
const lookup: PassportLookup = (component) =>
  component === passport.component ? passport : undefined;

describe("Icon", () => {
  it("рендерит ОДИН узел `<svg>` и ничего вокруг", () => {
    const host = mount(() => <Icon icon={ChevronDown} />);

    expect(host.children.length).toBe(1);
    expect(host.firstElementChild?.tagName).toBe("svg");
  });

  it("несёт адрес анатомии на самом узле", () => {
    const host = mount(() => <Icon icon={ChevronDown} />);
    const node = one(host, "svg");

    expect(node.getAttribute("data-scope")).toBe("icon");
    expect(node.getAttribute("data-part")).toBe("root");
  });

  it("`icon` — наш проп, а не атрибут: на узле его нет", () => {
    const host = mount(() => <Icon icon={ChevronDown} />);

    expect(one(host, "svg").hasAttribute("icon")).toBe(false);
  });

  it("рисует НАСТОЯЩИЙ значок lucide, а не заглушку", () => {
    // Путь `chevron-down` — данные самого `lucide-solid`, не наши: доказывает, что узел рисует
    // импортированный компонент, а не то, что кит сочинил рядом.
    const host = mount(() => <Icon icon={ChevronDown} />);

    expect(one(host, "svg").querySelector('path[d="m6 9 6 6 6-6"]')).not.toBeNull();
  });

  it("`icon` реактивен — смена пропа переключает НАРИСОВАННЫЙ значок на живом узле", () => {
    const [текущий, setТекущий] = createSignal<Component<LucideProps>>(ChevronDown);
    const host = mount(() => <Icon icon={текущий()} />);

    expect(one(host, "svg").querySelector('path[d="m6 9 6 6 6-6"]')).not.toBeNull();

    setТекущий(() => ArrowRight);

    expect(one(host, "svg").querySelector('path[d="m6 9 6 6 6-6"]')).toBeNull();
    expect(one(host, "svg").querySelector('path[d="M5 12h14"]')).not.toBeNull();
  });

  it("обработчик потребителя доходит до узла — диспетчеризацией, не `.click()`", () => {
    // `SVGElement.click()` в jsdom не существует (`test/contract.test.tsx` называет причину);
    // настоящий клик мышью в браузере — событие, а не метод, и диспетчеризация проверяет ровно
    // то же самое: обработчик потребителя доехал до узла и вызвался.
    const onClick = vi.fn();
    const host = mount(() => <Icon icon={ChevronDown} onClick={onClick} />);

    one(host, "svg").dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  // ОТСТУПЛЕНИЕ ОТ «НОЛЬ СТИЛЕЙ ПО УМОЛЧАНИЮ» (README, «Четыре принципа») — первое, что несёт не
  // наш поставщик и не `@kobalte/core`, а `lucide-solid`: он кладёт `class="lucide lucide-icon
  // lucide-…"` на КАЖДЫЙ свой `<svg>` изнутри собственного `Icon`, которого кит не переписывает
  // (гейт `PWEB-107` требует настоящий узел `lucide-solid` без обёрток). Ни одна из этих строк
  // не отвечает ни одному правилу скина `probe-web` — они мертвы для наших правил, — и снять их
  // нечем, не разобрав чужой компонент. Названо здесь и в `test/contract.test.tsx`
  // (`WITH_SERVICE_CLASS`), как README называет отступления `@kobalte/core`.
  describe("класс — отступление, которое несёт lucide-solid, не мы", () => {
    it("по умолчанию несёт СЛУЖЕБНЫЙ класс lucide, а не пустой", () => {
      const host = mount(() => <Icon icon={ChevronDown} />);
      const класс = one(host, "svg").getAttribute("class")?.split(" ") ?? [];

      expect(класс).toContain("lucide");
    });

    it("класс потребителя доезжает — СЛИТЫМ со служебным, а не потерянным", () => {
      const host = mount(() => <Icon icon={ChevronDown} class="мой-класс" />);
      const класс = one(host, "svg").getAttribute("class")?.split(" ") ?? [];

      expect(класс).toContain("мой-класс");
      expect(класс).toContain("lucide");
    });
  });
});

describe("паспорт значка", () => {
  it("часть анатомии появляется в документе — её же атрибутами", () => {
    const host = mount(() => <Icon icon={ChevronDown} />);
    const node = one(host, "svg");

    for (const part of anatomy.keys()) {
      for (const [name, value] of Object.entries(parts[part].attrs)) {
        expect(node.getAttribute(name)).toBe(value);
      }
    }
  });

  it("словарь состояний ПУСТ — и это утверждение, а не пробел", () => {
    for (const part of passport.parts) expect(part.states).toEqual([]);
  });

  it("род объявлен `icon` — значок и есть тот кандидат, под который заведён `accepts` у кнопки и гармошки", () => {
    expect(passport.genus).toBe("icon");
  });

  it("добавка покрывает РОВНО части анатомии — ни больше, ни меньше", () => {
    expect(passport.parts.map((part) => part.name).sort()).toEqual([...anatomy.keys()].sort());
  });

  it("корень назван и есть среди частей", () => {
    expect(anatomy.keys()).toContain(passport.root);
  });

  it("имя компонента снято с анатомии, а не написано рядом", () => {
    expect(passport.component).toBe(parts[passport.root].attrs["data-scope"]);
  });

  it("группа не объявлена — значок в «прочем», умолчание рабочее", () => {
    expect(passport.group).toBeUndefined();
    expect(groupOf(passport)).toBe("other");
  });

  it("настроек из закрытого перечня нет — `size`/`color`/`strokeWidth` это пропы lucide, не SETTINGS", () => {
    expect(passport.settings).toEqual({});
  });

  it("базовой сборки нет — обязательный проп `icon` это ссылка на компонент, не данные", () => {
    expect(passport.assembly).toBeUndefined();
  });

  it("поставщик назван и совпадает с манифестом", () => {
    expect(passport.package).toBe(manifest.name);
  });

  it("внутрь корня не кладут ничего — место занято самим значком", () => {
    const root = passport.parts.find((part) => part.name === passport.root);

    if (!root) throw new Error("у значка нет добавки на корневую часть");

    expect(admits(root, content("text"))).toBe(false);
    expect(admits(root, content("icon"))).toBe(false);
    expect(admits(root, content("component"))).toBe(false);
    expect(admits(root, { kind: "part", name: "root" })).toBe(false);
  });

  it("узел превращается в координату — скину есть что адресовать", () => {
    const host = mount(() => <Icon icon={ChevronDown} data-variant="приглушённый" />);

    expect(coordinateOf(one(host, "svg"), lookup)).toEqual({
      component: "icon",
      part: "root",
      states: [],
      variant: "приглушённый",
    });
  });
});
