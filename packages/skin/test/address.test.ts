// АДРЕС → СЕЛЕКТОР. Главное, что здесь проверяется, — что селектор ПОРОЖДЁН, а не написан.
//
// Поэтому ожидание почти нигде не записано строкой: строка в пробе — это второй рукописный
// селектор, и совпадать с анатомией он будет ровно до первой её правки. Ожидание собирается ИЗ
// ТОГО ЖЕ источника, из которого его берёт механика, — из `anatomy.build()` и из словаря
// состояний паспорта.

import { describe, expect, it } from "vitest";

import {
  ancestorSelector,
  anyOf,
  markSelector,
  nodeSelector,
  partSelector,
  passportLookup,
  safeName,
  stateSelector,
  variantAlternatives,
  variantSelector,
  type PassportLookup,
} from "../src/address.js";
import { withPassports } from "../src/bound.js";
import { FORCE_ATTRIBUTE, NODE_ATTRIBUTE } from "../src/marks.js";
import { buttonPassport, fieldPassport } from "./passports.js";

describe("селектор части", () => {
  it("собран из адресных атрибутов анатомии, а не написан", () => {
    const attrs = buttonPassport.anatomy.build().root.attrs;
    const expected = Object.entries(attrs)
      .map(([name, value]) => `[${name}="${value}"]`)
      .join("");

    expect(partSelector(buttonPassport, "root")).toBe(expected);
  });

  it("несёт КАЖДЫЙ адресный атрибут: добавит анатомия третий — он приедет сам", () => {
    const selector = partSelector(fieldPassport, "control")!;

    for (const [name, value] of Object.entries(fieldPassport.anatomy.build().control.attrs)) {
      expect(selector).toContain(`[${name}="${value}"]`);
    }
  });

  it("часть, которой компонент не объявлял, адреса не получает", () => {
    expect(partSelector(buttonPassport, "нету")).toBeUndefined();
  });
});

describe("селектор состояния", () => {
  it("атрибутное состояние — просто атрибут", () => {
    expect(stateSelector(buttonPassport, "root", "disabled")).toBe("[data-disabled]");
  });

  it("состояние со значением атрибута несёт и значение", () => {
    expect(stateSelector(buttonPassport, "root", "busy")).toBe('[aria-busy="true"]');
  });

  it("псевдокласс получает пару с принудительным признаком — иначе предпросмотр слеп", () => {
    expect(stateSelector(buttonPassport, "root", "hover")).toBe(
      `:is(:hover, [${FORCE_ATTRIBUTE}~="hover"])`,
    );
  });

  it("в принудительном признаке стоит имя СОСТОЯНИЯ, а не псевдокласс", () => {
    // Имя состояния переживает смену кита, разметка — нет. Проверяем именно это: `focus-visible`,
    // а не `:focus-visible`.
    expect(stateSelector(buttonPassport, "root", "focus-visible")).toBe(
      `:is(:focus-visible, [${FORCE_ATTRIBUTE}~="focus-visible"])`,
    );
  });

  it("каждое объявленное состояние кнопки адресуемо — ни одного мёртвого имени", () => {
    const states = buttonPassport.parts[0]!.states;

    expect(states.length).toBeGreaterThan(0);
    for (const state of states) {
      expect(stateSelector(buttonPassport, "root", state.name)).toBe(
        markSelector(state.name, state.mark),
      );
    }
  });

  it("необъявленное состояние адреса не получает", () => {
    expect(stateSelector(buttonPassport, "root", "выдумано")).toBeUndefined();
  });
});

describe("селектор вариации", () => {
  const axis = buttonPassport.variantAxis.mark;
  const attribute = axis.kind === "attribute" ? axis.name : "";

  it("обычная вариация — атрибут оси со значением", () => {
    expect(variantSelector(buttonPassport, "тихая", false)).toBe(`[${attribute}="тихая"]`);
  });

  it("умолчание и ОТСУТСТВИЕ атрибута — один адрес, а не два", () => {
    expect(variantSelector(buttonPassport, "главная", true)).toBe(
      `:is([${attribute}="главная"], :not([${attribute}]))`,
    );
  });

  it("доводы отдаются по отдельности — чтобы пересечение не плодило скобки", () => {
    expect(variantAlternatives(buttonPassport, "главная", true)).toEqual([
      `[${attribute}="главная"]`,
      `:not([${attribute}])`,
    ]);
  });
});

describe("селектор предка", () => {
  it("часть-владелец со своими состояниями", () => {
    const own = partSelector(fieldPassport, "root")!;

    expect(ancestorSelector(fieldPassport, "root", ["disabled"])).toBe(`${own}[data-disabled]`);
  });

  it("без состояний — просто часть", () => {
    expect(ancestorSelector(fieldPassport, "root")).toBe(partSelector(fieldPassport, "root"));
  });

  it("необъявленное состояние предка отменяет весь адрес", () => {
    expect(ancestorSelector(fieldPassport, "root", ["выдумано"])).toBeUndefined();
  });
});

describe("вторая область адреса", () => {
  it("узел адресуется признаком, который ставит механика сборки", () => {
    expect(nodeSelector("btn-1")).toBe(`[${NODE_ATTRIBUTE}="btn-1"]`);
  });
});

describe("складывание доводов", () => {
  it("один довод остаётся собой", () => {
    expect(anyOf(["[a]"])).toBe("[a]");
  });

  it("несколько — один уровень `:is()`", () => {
    expect(anyOf(["[a]", "[b]"])).toBe(":is([a], [b])");
  });

  it("нечем адресовать — нечего и складывать", () => {
    expect(anyOf(undefined)).toBeUndefined();
  });
});

describe("пригодность имени", () => {
  it("имя человека проходит", () => {
    expect(safeName("danger-outline")).toBe(true);
    expect(safeName("главная")).toBe(true);
  });

  it("кавычка и обратная косая — нет: они закрыли бы литерал раньше времени", () => {
    expect(safeName('вот"такое')).toBe(false);
    expect(safeName("вот\\такое")).toBe(false);
    expect(safeName("")).toBe(false);
  });
});

describe("сборщик читателя — место одно, и оно наружу (`PWEB-95`)", () => {
  // Половина механики просит ЧИТАТЕЛЯ, половина — ПЕРЕЧЕНЬ, и сходятся они здесь. Пока сборка не
  // была выведена, держатель перечня обязан был написать свою карту — то есть сделать ровно то,
  // что запрещает шапка этой функции.

  it("перечень превращается в читатель: своё имя находится, чужое — нет", () => {
    const читатель: PassportLookup = passportLookup([buttonPassport, fieldPassport]);

    expect(читатель(buttonPassport.component)).toBe(buttonPassport);
    expect(читатель(fieldPassport.component)).toBe(fieldPassport);
    expect(читатель("нездешний")).toBeUndefined();
  });

  it("держатель перечня связывает механику В ДВА ХОДА, а не пишет карту сам", () => {
    // Ровно тот путь, ради которого сборка и выведена: перечень → читатель → связка (`PWEB-94`).
    const { checkSkin } = withPassports(passportLookup([buttonPassport]));

    expect(checkSkin({ name: "проба", recipes: {} })).toEqual([]);
    expect(
      checkSkin({
        name: "проба",
        recipes: { нездешний: { base: { root: { props: { color: "red" } } } } },
      }).map((flaw) => flaw.name),
    ).toEqual(["unknown-component"]);
  });
});
