// ГЕЙТ «НАДЕТЫЙ СКИН НАЗЫВАЕТ БРАУЗЕРУ СВОЮ ПОЛОВИНУ» (`PWEB-55`).
//
// Базовый слой объявляет СПОСОБНОСТЬ — «страница умеет обе половины, следуй за человеком».
// Конкретный режим назвать ему нечем: режим принадлежит скину, а скина база не знает. Значит
// назвать его больше некому, и не назови мы — страница разъезжается пополам молча: полосы
// прокрутки и нестилизованные поля идут за настройкой системы, компоненты — за скином.
//
// ## Мерим ЖИВЫМ ДОКУМЕНТОМ, а не поиском строки
//
// Вопрос задачи — «что страница ОТВЕЧАЕТ на вопрос о режиме», и отвечает на него каскад, а не
// текст файла. Поиск подстроки прошёл бы и на объявлении, которое ничего не перебивает.
//
// Документ здесь свой (`JSDOM`), а не общий: пробе нужно управлять СОСТАВОМ И ПОРЯДКОМ листов —
// голый документ, база, база со скином, — а общий документ проекта `model` пуст по устройству.
//
// ## ПРЕДЕЛ ИНСТРУМЕНТА НАЗВАН
//
// jsdom каскадные слои НЕ понимает: правила внутри `@layer` он молча игнорирует целиком (то же
// ограничение названо в `cascade.test.ts`). Нашему ответу это не мешает — он живёт ВНЕ слоя, и
// именно поэтому проба живым документом здесь вообще возможна.
//
// Но обратное jsdom показать не может: что объявление, положенное В СЛОЙ, проиграло бы базе в
// настоящем браузере. Это правило каскада (обычное объявление вне слоя перебивает любое
// объявление внутри слоя — CSS Cascade 5, сверено 2026-08-22), а не наблюдение, и здесь оно
// стережётся ТЕКСТОВОЙ пробой «объявление стоит вне слоя». Уедь оно в слой — покраснеет она,
// потому что живой документ этого не заметит.
//
// Чего здесь нет и быть не может: как ВЫГЛЯДИТ системный элемент. Полос прокрутки и встроенных
// контролов jsdom не рисует вовсе — это проверяется настоящим браузером, и след этой проверки
// живёт в узле задачи, а не здесь.

import { JSDOM } from "jsdom";
import postcss from "postcss";
import { describe, expect, it } from "vitest";

import { flattenCss } from "../src/flatten.js";
import { generateSkinCss } from "../src/generate.js";
import { DARK_CLASS } from "../src/marks.js";
import type { Skin } from "../src/model.js";
import { inLayer } from "./helpers/layers.js";
import { lookup } from "./passports.js";

/** Скин с обеими половинами: пара записана человеком, значения половин расходятся. */
const paired: Skin = {
  name: "пара",
  variables: { light: { ink: "black" }, dark: { ink: "white" } },
  recipes: {},
};

/** Скин БЕЗ тёмной половины: записана одна светлая, и переключать нечего. */
const lightOnly: Skin = {
  name: "только-светлый",
  variables: { light: { ink: "black" } },
  recipes: {},
};

/**
 * Что документ отвечает про режим под данными листами.
 *
 * `dark` — стоит ли на корне класс режима, тот самый, который ставит рантайм надетому скину.
 */
function answer(sheets: readonly string[], dark = false): string {
  const dom = new JSDOM(
    "<!doctype html><html><head>" +
      sheets.map((css) => `<style>${css}</style>`).join("") +
      `</head><body></body></html>`,
  );
  const root = dom.window.document.documentElement;
  if (dark) root.classList.add(DARK_CLASS);

  return dom.window.getComputedStyle(root).getPropertyValue("color-scheme").trim();
}

/** Объявления `color-scheme` вместе с ответом, лежат ли они в слое. */
function declarations(css: string): { value: string; layered: boolean }[] {
  const found: { value: string; layered: boolean }[] = [];

  postcss.parse(css).walkDecls("color-scheme", (decl) => {
    found.push({ value: decl.value, layered: inLayer(decl) });
  });

  return found;
}

describe("надетый скин называет свою половину", () => {
  it("светлая половина названа — страница отвечает «светлая», а не «следуй за человеком»", () => {
    expect(answer([generateSkinCss(paired, lookup)])).toBe("light");
  });

  it("под классом режима надета тёмная — и страница отвечает «тёмная»", () => {
    expect(answer([generateSkinCss(paired, lookup)], true)).toBe("dark");
  });

  it("проба не слепа: без листа скина документ не отвечает ничего", () => {
    // Положительный контроль замера. Без него «страница отвечает light» проходило бы и на
    // сломанном порождении: значение просто совпало бы с тем, что даёт пустой документ.
    expect(answer([])).not.toBe("light");
    expect(answer([], true)).not.toBe("dark");
  });
});

describe("тёмная называется тогда, когда она есть", () => {
  it("у скина без тёмной половины ответ остаётся светлым и ПОД КЛАССОМ РЕЖИМА", () => {
    // Иначе получилось бы ровно то расхождение, ради которого задача заведена, только своими
    // руками: системные элементы затемнены, компоненты — нет, потому что затемнять было нечем.
    expect(answer([generateSkinCss(lightOnly, lookup)], true)).toBe("light");
  });

  it("«тёмной нет» — это отсутствие объявления, а не второе светлое", () => {
    expect(declarations(generateSkinCss(lightOnly, lookup)).map((decl) => decl.value)).toEqual([
      "light",
    ]);
    expect(declarations(generateSkinCss(paired, lookup)).map((decl) => decl.value)).toEqual([
      "light",
      "dark",
    ]);
  });
});

describe("объявление стоит ВНЕ слоя — иначе оно не сделало бы ничего", () => {
  // Стережёт то, чего живой документ выше увидеть не может: в настоящем браузере обычное
  // объявление вне слоя перебивает ЛЮБОЕ объявление внутри слоя, и способность из базы победила
  // бы наш выбор молча. jsdom этого не покажет — он слои игнорирует, а не упорядочивает.
  it("ни одно объявление режима не лежит в слое", () => {
    for (const css of [generateSkinCss(paired, lookup), generateSkinCss(lightOnly, lookup)]) {
      expect(declarations(css).map((decl) => decl.layered)).not.toContain(true);
    }
  });

  it("а сам скин из слоя никуда не делся — вне его живёт ТОЛЬКО ответ о режиме", () => {
    const outside: string[] = [];

    postcss.parse(generateSkinCss(paired, lookup)).walkRules((rule) => {
      if (!inLayer(rule)) outside.push(rule.toString());
    });

    expect(outside).toHaveLength(2);
    for (const rule of outside) expect(rule).toContain("color-scheme");
  });

  it("плоская форма ответ не теряет — обе формы описывают один и тот же вид", () => {
    expect(declarations(flattenCss(generateSkinCss(paired, lookup)))).toEqual(
      declarations(generateSkinCss(paired, lookup)),
    );
  });
});
