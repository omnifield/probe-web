import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { DENSITY_DEFAULT, DENSITY_TOKEN, DERIVED_TOKENS, FIXED_TOKENS } from "../src/dimension.js";
import { DEFAULT_THEME_MODEL, themeModelToCss } from "../src/model.js";
import { DEFAULT_PALETTE, paletteSelector } from "../src/palette.js";
import { LEGACY_TOKENS, ROLE_TOKENS } from "../src/roles.js";
import { DEFAULT_DARK, DEFAULT_LIGHT, SCALE_TOKENS, THEME_META_TOKENS } from "../src/tokens.js";

// ГЕЙТ ПОСТАВЛЯЕМОЙ ПАЛИТРЫ и документа БЕЗ неё (`kb:PROBEWEB-18`).
//
// Проверяем СОБРАННЫЕ `dist/css/*.css`, а не исходники: правило «`:root` палитрой не
// красится» нарушается сборкой, а не намерением, — ровно так оно и было нарушено, когда
// дефолт собирался отдельной веткой скрипта.
//
// Читаем текстом, но по правилам, а не подстрокой: заголовок файла сам рассказывает про
// `:root` и про `data-theme`, и наивный `grep` спотыкался бы о собственную документацию.
// У потребителя этот заголовок к тому же срежет минификатор.

const read = (name: string): string =>
  readFileSync(resolve(import.meta.dirname, `../dist/css/${name}`), "utf8");

const themes = read("themes.css");
const base = read("base.css");

const strip = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, "");

interface Rule {
  selector: string;
  declarations: Map<string, string>;
}

/**
 * Правила файла: внутренние блоки со своим селектором. Обёртки вроде `@supports` при этом
 * не теряются — правило внутри разбирается само по себе, а обёртка на то, КУДА оно целится,
 * не влияет.
 */
const rules = (css: string): Rule[] =>
  [...strip(css).matchAll(/([^{}]*)\{([^{}]*)\}/g)].map((match) => {
    const declarations = new Map<string, string>();
    for (const line of match[2].split(";")) {
      const [, name, value] = /^\s*--([\w-]+):\s*([\s\S]+)$/.exec(line) ?? [];
      if (name) declarations.set(name, (value as string).trim());
    }
    return { selector: match[1].trim().replace(/^@supports[^{]*$/, "@supports"), declarations };
  });

/** Значения блока по его селектору. */
const block = (css: string, selector: string): Record<string, string> => {
  const rule = rules(css).find((item) => item.selector === selector);
  expect(rule, `блок «${selector}» найден`).toBeDefined();
  return Object.fromEntries((rule as Rule).declarations);
};

const PALETTE_CONTRACT = new Set<string>([...SCALE_TOKENS, ...THEME_META_TOKENS]);

describe("собранный themes.css", () => {
  it("ни одно правило палитры не целится в `:root`", () => {
    // Покрашенный корень означал бы, что пресет не источник вида, а перебивка поверх уже
    // покрашенного, — и «пресетов нет» выразить было бы нечем.
    for (const rule of rules(themes)) {
      expect(rule.selector, "правило палитры целится в корень").not.toContain(":root");
    }
  });

  it("каждое правило цепляется за имя палитры — и ни за что другое", () => {
    // Обратная сторона той же монеты: мало не целиться в `:root`, надо цепляться ИМЕННО за
    // имя. Иначе палитра приехала бы, скажем, на `body` — и снова мимо выбора пресета.
    const expected = new Set([
      paletteSelector(DEFAULT_PALETTE, "light"),
      paletteSelector(DEFAULT_PALETTE, "dark"),
    ]);

    expect(new Set(rules(themes).map((rule) => rule.selector))).toEqual(expected);
  });

  it("дефолт проехал ОБЩИМ путём: файл содержит вывод `themeModelToCss` дословно", () => {
    // Не «похоже на пресет», а буквально тот же вызов: своей ветки у дефолта в сборке нет.
    expect(themes).toContain(themeModelToCss(DEFAULT_THEME_MODEL));
  });

  it("дефолт и кастомная палитра порождают блок одной формы — разница ровно в имени", () => {
    const custom = themeModelToCss({ ...DEFAULT_THEME_MODEL, id: "ocean" });

    expect(custom.replaceAll("ocean", DEFAULT_PALETTE)).toBe(
      themeModelToCss(DEFAULT_THEME_MODEL),
    );
  });

  it("светлая половина — токен-в-токен с DEFAULT_LIGHT плюс плотность", () => {
    expect(block(themes, paletteSelector(DEFAULT_PALETTE, "light"))).toEqual({
      ...DEFAULT_LIGHT,
      [DENSITY_TOKEN]: DENSITY_DEFAULT,
    });
  });

  it("тёмная половина — токен-в-токен с DEFAULT_DARK", () => {
    expect(block(themes, paletteSelector(DEFAULT_PALETTE, "dark"))).toEqual(DEFAULT_DARK);
  });

  it("ролей и устаревших псевдонимов в палитре нет — они живут в base.css", () => {
    const body = strip(themes);
    for (const role of ROLE_TOKENS) expect(body).not.toContain(`--${role}:`);
    for (const legacy of LEGACY_TOKENS) expect(body).not.toContain(`--${legacy}:`);
  });
});

describe("документ без `data-theme`", () => {
  /** Правила обоих поставляемых файлов, которые подходят документу БЕЗ имени палитры. */
  const unthemed = [...rules(base), ...rules(themes)].filter(
    (rule) => !rule.selector.includes("data-theme"),
  );

  it("не получает НИ ОДНОГО токена палитры", () => {
    // Это и есть «нет выбранного пресета → нет оформления»: не потому, что мы где-то это
    // проверяем, а потому что красить нечему — ни одно правило палитры не подошло.
    const painted = unthemed.flatMap((rule) =>
      [...rule.declarations.keys()].filter((token) => PALETTE_CONTRACT.has(token)),
    );

    expect([...new Set(painted)], "токен палитры приезжает без выбора палитры").toEqual([]);
  });

  it("получает всю геометрию, и она РАЗРЕШАЕТСЯ без палитры", () => {
    // Инвариант 4 (`kb:SKIN-7`): страница без единого файла скина пригодна к работе. Держится
    // он не обещанием, а фолбэком в каждой ссылке на семя — семена приезжают палитрой,
    // которой здесь нет.
    const declared = new Map(unthemed.flatMap((rule) => [...rule.declarations]));
    const geometry = [...DERIVED_TOKENS, ...FIXED_TOKENS.map((item) => item.name)];

    for (const token of geometry) {
      const value = declared.get(token);
      expect(value, `--${token} не объявлен для документа без палитры`).toBeDefined();

      // Ссылка разрешима, если её цель объявлена тем же набором правил; на всё, что
      // приезжает палитрой, обязан стоять фолбэк — иначе значение станет недействительным,
      // и «нецветная» страница окажется вдобавок бесформенной.
      for (const match of (value as string).matchAll(/var\(\s*--([\w-]+)\s*(,?)/g)) {
        const target = match[1];
        const hasFallback = match[2] === ",";
        expect(
          hasFallback || declared.has(target),
          `--${token} ссылается на --${target} без фолбэка, а тот приезжает палитрой`,
        ).toBe(true);
      }
    }
  });

  it("режим остаётся ортогонален палитре", () => {
    // Смена `.dark` не трогает выбор палитры: правила режима про палитру не знают вовсе.
    for (const rule of rules(base)) {
      if (rule.selector.includes(".dark")) {
        expect(rule.selector, "правило режима цепляет имя палитры").not.toContain("data-theme");
      }
    }

    // …и наоборот: тёмная половина палитры включается КЛАССОМ, а не вторым её именем —
    // иначе `default-dark` снова стал бы отдельной темой (инвариант 3).
    const dark = paletteSelector(DEFAULT_PALETTE, "dark");
    expect(dark).toContain(paletteSelector(DEFAULT_PALETTE, "light"));
    expect(dark).toContain(".dark");
  });
});
