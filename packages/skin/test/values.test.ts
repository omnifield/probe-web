// ПРОВЕРКА ЗНАЧЕНИЙ — требование, выросшее из замера, а не из осторожности.
//
// Замерено (`PWEB-28`): имя несуществующего токена уехало в вывод без единого слова. Браузер
// такое правило выбрасывает ЦЕЛИКОМ, а человек идёт чинить ВИД — потому что видит испорченную
// кнопку, а не сообщение. Поэтому проверка своя и заложена сразу, а не после первого испорченного
// скина.
//
// Где проходит граница. Ограничиваем АДРЕС, а не значение (страница «Скин»): списка разрешённых
// свойств нет и не будет. Отвергается ровно одно — ССЫЛКА НА ИМЯ, которого никто не объявлял.
// Литерал, человеческое значение, чужой токен из объявленного словаря — всё законно.

import { describe, expect, it } from "vitest";

import type { Skin } from "../src/model.js";
import { checkSkin } from "../src/rules.js";
import { lookup } from "./passports.js";

/** Скин из одного значения — самая узкая проба, какую можно поставить. */
function withValue(value: string, variables?: Skin["variables"]): Skin {
  return {
    name: "п",
    ...(variables ? { variables } : {}),
    recipes: { button: { base: { root: { props: { color: value } } } } },
  };
}

function flaws(skin: Skin, tokens?: string[]) {
  return checkSkin(skin, lookup, tokens ? { tokens } : {});
}

describe("ссылка на значение", () => {
  it("неизвестное имя ОТВЕРГАЕТСЯ, а не проезжает", () => {
    const found = flaws(withValue("var(--нет-такого)"));

    expect(found.map((f) => f.name)).toEqual(["unknown-value"]);
    expect(found[0]!.means).toContain("--нет-такого");
  });

  it("имя из объявленного снаружи словаря проходит", () => {
    expect(flaws(withValue("var(--brand-9)"), ["brand-9"])).toEqual([]);
  });

  it("словарь принимает имя в обоих начертаниях", () => {
    expect(flaws(withValue("var(--brand-9)"), ["--brand-9"])).toEqual([]);
  });

  it("СОБСТВЕННАЯ переменная скина известна без всякого словаря", () => {
    const skin = withValue("var(--skin-ink)", { light: { "skin-ink": "black" } });

    expect(flaws(skin)).toEqual([]);
  });

  it("переменная тёмной половины тоже известна", () => {
    const skin = withValue("var(--только-ночью)", {
      light: {},
      dark: { "только-ночью": "black" },
    });

    expect(flaws(skin)).toEqual([]);
  });

  it("запасное значение снимает отказ: автор сам назвал, что будет без имени", () => {
    expect(flaws(withValue("var(--чужое, 4px)"))).toEqual([]);
  });

  it("во вложенном имени с запасным проверяется вложенное", () => {
    // Внешняя ссылка защищена запасным, внутренняя — нет, и именно она отвергается.
    const found = flaws(withValue("var(--чужое, var(--тоже-нет))"));

    expect(found.map((f) => f.name)).toEqual(["unknown-value"]);
    expect(found[0]!.means).toContain("--тоже-нет");
  });

  it("несколько ссылок в одном значении проверяются все", () => {
    expect(flaws(withValue("1px solid var(--нет-1) var(--нет-2)"))).toHaveLength(2);
  });

  it("значение внутри at-правила проверяется так же, как снаружи", () => {
    const skin: Skin = {
      name: "п",
      recipes: {
        button: {
          base: {
            root: { props: { "@media (min-width: 40rem)": { color: "var(--нет-такого)" } } },
          },
        },
      },
    };

    expect(flaws(skin).map((f) => f.name)).toEqual(["unknown-value"]);
  });

  it("значение САМОЙ переменной проверяется — половина скина такая же половина", () => {
    const skin: Skin = {
      name: "п",
      variables: { light: { "skin-ink": "var(--нет-такого)" } },
      recipes: {},
    };

    expect(flaws(skin).map((f) => f.name)).toEqual(["unknown-value"]);
  });

  it("значение ступени движения проверяется", () => {
    const skin: Skin = {
      name: "п",
      keyframes: { пульс: { from: { color: "var(--нет-такого)" } } },
      recipes: {},
    };

    expect(flaws(skin).map((f) => f.name)).toEqual(["unknown-value"]);
  });
});

describe("свобода значения не отменяется", () => {
  it("литерал законен: скин, собранный человеком, полон человеческих значений", () => {
    expect(flaws(withValue("oklch(0.62 0.19 27)"))).toEqual([]);
  });

  it("число законно, и единицу называет автор — единицу мы не угадываем", () => {
    const skin: Skin = {
      name: "п",
      recipes: { button: { base: { root: { props: { opacity: 0.5, zIndex: 10 } } } } },
    };

    expect(flaws(skin)).toEqual([]);
  });
});

describe("пустое значение", () => {
  it("пустая строка — мёртвое правило, а не значение", () => {
    expect(flaws(withValue("   ")).map((f) => f.name)).toEqual(["empty-value"]);
  });

  it("не-число числом не считается", () => {
    const skin: Skin = {
      name: "п",
      recipes: { button: { base: { root: { props: { opacity: Number.NaN } } } } },
    };

    expect(flaws(skin).map((f) => f.name)).toEqual(["empty-value"]);
  });
});
