// Гейт ПАСПОРТА (`tasker:PWEB-2`) — проверка в ОБЕ стороны.
//
// Паспорт выписан руками, и это осознанно: снятый с исходников перечень подтверждал бы сам
// себя — переименование части проехало бы вместе с правкой, а сломался бы вид у потребителя,
// после выпуска и молча. Цена ручного перечня одна: он расходится с кодом так же тихо.
// Поэтому расхождение ловится здесь, и обе стороны нужны:
//
//   1. КАЖДАЯ объявленная часть обязана появиться в разметке. Иначе паспорт обещает скину
//      адрес, которого в документе нет: правило есть, цеплять нечего, и «одето» окажется
//      только на бумаге.
//   2. КАЖДАЯ зацепка исходника обязана быть в паспорте. Иначе у части нет адреса: скин её не
//      увидит, редактор не предложит, и она останется голой при полностью «одетом» компоненте.
//
// Сверх этого проверяется то, чего в перечне слотов нет вовсе и проверить больше негде:
// состояния (объявленное выражается в разметке ровно тем, чем объявлено) и варианты (имя
// намерения доезжает до узла атрибутом, потому что пишет его ПОТРЕБИТЕЛЬ, а кит пропускает
// насквозь).
//
// Проверка живая — RENDER в документ, как и весь предмет зоны: снятая с модуля зацепка не
// отличается от поставленной на узел, а расходятся они молча.

import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { JSX } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";

import { Button } from "../src/button.jsx";
import { PASSPORTS, type ComponentPassport, passportOf } from "../src/passport.js";
import { cleanup, mount, one } from "./dom.jsx";
import { PROMISED_SLOTS } from "./slot-list.js";

afterEach(cleanup);

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(here, "..", "src");

/**
 * Компонент с паспортом: чем он объявлен, где его исходник и как поставить в документ ВСЕ его
 * части разом.
 *
 * Список растёт по одному вместе с разносом паспортов по компонентам (`tasker:PWEB-7`): новый
 * паспорт без строки здесь не проверяется ничем, поэтому его отсутствие роняет прогон отдельной
 * пробой ниже.
 */
const PASSPORTED: ReadonlyArray<{
  passport: ComponentPassport;
  source: string;
  scene: () => JSX.Element;
}> = [
  {
    passport: PASSPORTS.button,
    source: "button.tsx",
    scene: () => <Button>Отправить</Button>,
  },
];

/**
 * Зацепки, поставленные исходником.
 *
 * Комментарии срезаются: в доке компонентов `data-slot` стоит примерами CSS, и правило из
 * примера зацепкой не является — предмет здесь только атрибут в разметке (та же выжимка, что и
 * в `test/slots.test.tsx`; сливать их в общий помощник нельзя, предметы у проб разные).
 */
function slotsInSource(source: string): string[] {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

  return [
    ...[...code.matchAll(/data-slot="([^"]+)"/g)].map((match) => match[1]),
    ...[...code.matchAll(/useSlot\(props, "([^"]+)"\)/g)].map((match) => match[1]),
  ];
}

/** Имена зацепок, реально доехавшие до узлов контейнера, — списком через пробел. */
function slotsInDocument(host: ParentNode): string[] {
  const found = [...host.querySelectorAll("[data-slot]")].flatMap((node) =>
    (node.getAttribute("data-slot") ?? "").split(/\s+/).filter(Boolean),
  );

  return [...new Set(found)].sort();
}

describe("паспорта вообще есть и читаются по имени", () => {
  it("перечень не пуст и каждый паспорт достаётся `passportOf`", () => {
    // Иначе весь перебор ниже шёл бы по пустому списку и был бы зелёным, ничего не проверив.
    expect(PASSPORTED.length).toBeGreaterThan(0);

    for (const { passport } of PASSPORTED) {
      expect(passportOf(passport.component)).toBe(passport);
    }
  });

  it("каждый паспорт пакета попал под проверку", () => {
    // Паспорт, объявленный в поставке, но не внесённый сюда, не проверяется ничем: он обещал
    // бы скину адреса, которых никто не сверял с разметкой.
    expect(PASSPORTED.map((entry) => entry.passport.component).sort()).toEqual(
      Object.keys(PASSPORTS).sort(),
    );
  });

  it("компонент без паспорта отдаёт `undefined`, а не заглушку", () => {
    // Молчаливая заглушка выглядела бы как объявленный контракт: редактор показал бы компонент
    // «с пустым паспортом» вместо того, чтобы честно сказать, что его ещё не одевали.
    expect(passportOf("такого-компонента-нет")).toBeUndefined();
  });
});

describe.each(PASSPORTED)("паспорт компонента $passport.component", (entry) => {
  const { passport, source, scene } = entry;
  const parts = passport.parts.map((part) => part.name);

  describe("форма", () => {
    it("корень назван и есть среди частей", () => {
      expect(passport.root).toBe(passport.component);
      expect(parts).toContain(passport.root);
    });

    it("имена частей не повторяются", () => {
      // Повтор ломает адресацию молча: правило скина цепляется за имя, а какая из двух частей
      // имелась в виду — неизвестно.
      expect(new Set(parts).size).toBe(parts.length);
    });

    it("правила вложенности ссылаются на существующие части", () => {
      for (const part of passport.parts) {
        for (const child of part.children) expect(parts).toContain(child);
      }
    });

    it("имена состояний и вариантов не повторяются", () => {
      for (const part of passport.parts) {
        const states = part.states.map((state) => state.name);

        expect(new Set(states).size).toBe(states.length);
      }

      const variants = passport.variants.map((variant) => variant.name);

      expect(new Set(variants).size).toBe(variants.length);
    });

    it("поставщик назван — форма одна на всех, и читатель не знает имён пакетов заранее", () => {
      expect(passport.package).toBe("@omnifield/probe-web-ui");
    });
  });

  describe("часть ↔ разметка", () => {
    it("каждая объявленная часть появляется в документе", () => {
      const host = mount(scene);

      expect(slotsInDocument(host)).toEqual([...parts].sort());
    });

    it("каждая зацепка исходника объявлена паспортом", () => {
      const declared = slotsInSource(readFileSync(join(srcDir, source), "utf8"));

      expect(declared.length).toBeGreaterThan(0);
      for (const slot of declared) expect(parts).toContain(slot);
    });

    it("каждая часть — обещанное имя зацепки, а не выдуманное", () => {
      // Обещание по именам (`test/slot-list.ts`) и паспорт — разные предметы, но адрес скина
      // стоит на их пересечении: часть, которой нет в обещании, может быть переименована
      // минором, и правило скина отвалится без единой красноты.
      for (const part of parts) expect(PROMISED_SLOTS).toContain(part);
    });
  });

  describe("состояния", () => {
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
        const node = one(host, `[data-slot~="${state.part}"]`);

        // Псевдоэлемент — не состояние: `::before` рисует УЗЕЛ, которого нет в разметке, и
        // адресовать его как состояние части значило бы обещать несуществующее место.
        expect(name.startsWith(":")).toBe(true);
        expect(name.startsWith("::")).toBe(false);

        // Выдуманный псевдокласс роняет разбор селектора — ровно то, что нужно: скин порождает
        // селектор из адреса, и неразбираемый селектор стал бы мёртвым правилом.
        expect(() => node.matches(name)).not.toThrow();
      },
    );
  });

  describe("варианты", () => {
    it("объявлены — скин обязан одеть каждое намерение", () => {
      expect(passport.variants.length).toBeGreaterThan(0);
    });

    it.each(passport.variants)("`$name` доезжает до узла атрибутом", (variant) => {
      // Вариант пишет РАЗМЕТКА потребителя, а кит пропускает атрибут насквозь. Проверяется
      // именно проход: перехвати кит `data-variant` — и разметка потребителя перестала бы
      // задавать намерение, а скин цеплялся бы за то, чего на узле нет.
      expect(variant.mark.kind).toBe("attribute");
      if (variant.mark.kind !== "attribute") return;

      const { name, value } = variant.mark;
      const host = mount(() => <Button {...{ [name]: value }}>Удалить</Button>);
      const node = one(host, `[data-slot~="${passport.root}"]`);

      expect(node.getAttribute(name)).toBe(value);
      expect(value).toBe(variant.name);
    });
  });
});

describe("кнопка: состояния, выраженные атрибутом", () => {
  const states = PASSPORTS.button.parts[0].states;

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
    const node = one(host, "button");

    expect(node.hasAttribute(mark.name)).toBe(true);

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
});
