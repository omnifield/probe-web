import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { DEFAULT_PALETTE, PALETTE_ATTRIBUTE, paletteCss, paletteSelector } from "../src/palette.js";
import type { ThemeTokens } from "../src/tokens.js";

// ГЕЙТ ПРАВИЛА «палитра принимает ИМЯ, а не селектор» (`kb:PROBEWEB-18`).
//
// Правило держится не тем, что вывод селектора красиво вынесен в функцию, а тем, что
// ДРУГОГО вывода в зоне нет. Первое проверяется поведением функции, второе — обходом
// исходников: ровно тем местом, где прежняя развилка и жила (два места собирали
// `[data-theme="…"]` заново и совпали по случайности, третье красило `:root`).

const SRC = resolve(import.meta.dirname, "../src");

/** Файлы зоны с вырезанными комментариями: правило про КОД, а не про прозу в доках. */
const sources = (): Array<[string, string]> =>
  readdirSync(SRC, { recursive: true, encoding: "utf8" })
    .filter((name) => name.endsWith(".ts"))
    .map((name) => {
      const code = readFileSync(resolve(SRC, name), "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      return [name, code] as [string, string];
    });

describe("paletteSelector", () => {
  it("светлая половина — атрибут с именем, и ничего сверх него", () => {
    expect(paletteSelector("ocean", "light")).toBe('[data-theme="ocean"]');
  });

  it("тёмная — та же палитра плюс класс режима, в обеих формах носителя", () => {
    // Класс может стоять и на самом элементе с атрибутом, и на потомке внутри него.
    expect(paletteSelector("ocean", "dark")).toBe(
      '[data-theme="ocean"].dark, [data-theme="ocean"] .dark',
    );
  });

  it("режим ортогонален палитре: имя есть в обеих половинах, режим — только в тёмной", () => {
    // Привязав режим к имени, мы вернули бы `twitter-dark` отдельной темой — ровно то, что
    // запрещено инвариантом 3 (`kb:SKIN-7`).
    for (const part of paletteSelector("ocean", "dark").split(", ")) {
      expect(part).toContain('[data-theme="ocean"]');
      expect(part).toContain(".dark");
    }
    expect(paletteSelector("ocean", "light")).not.toContain("dark");
  });

  it("ни одна половина не целится в `:root`", () => {
    // Покрашенный корень означал бы, что палитра не источник вида, а перебивка поверх уже
    // покрашенного, — и состояние «палитра не выбрана» выразить было бы нечем.
    for (const mode of ["light", "dark"] as const) {
      expect(paletteSelector(DEFAULT_PALETTE, mode)).not.toContain(":root");
      expect(paletteSelector("ocean", mode)).not.toContain(":root");
    }
  });

  it("дефолт получает селектор той же формы, что и любая другая палитра", () => {
    // Именно это и есть «дефолт перестал быть особым случаем»: разница между ним и
    // кастомной палитрой — ровно имя, а не форма зацепки.
    for (const mode of ["light", "dark"] as const) {
      expect(paletteSelector(DEFAULT_PALETTE, mode)).toBe(
        paletteSelector("ocean", mode).replaceAll("ocean", DEFAULT_PALETTE),
      );
    }
  });

  it("имя дефолтной палитры — `default`, и оно уезжает в атрибут", () => {
    expect(DEFAULT_PALETTE).toBe("default");
    expect(PALETTE_ATTRIBUTE).toBe("data-theme");
    expect(paletteSelector(DEFAULT_PALETTE, "light")).toBe(
      `[${PALETTE_ATTRIBUTE}="${DEFAULT_PALETTE}"]`,
    );
  });
});

describe("paletteCss", () => {
  it("блок — селектор из имени плюс значения по строке на токен", () => {
    const css = paletteCss("ocean", "light", {
      "neutral-1": "red",
      "neutral-12": "blue",
    } as ThemeTokens);

    expect(css).toBe('[data-theme="ocean"] {\n  --neutral-1: red;\n  --neutral-12: blue;\n}');
  });

  it("тёмная половина берёт тёмный селектор, а не тот же самый", () => {
    const tokens = { "neutral-1": "red" } as ThemeTokens;
    expect(paletteCss("ocean", "dark", tokens)).toContain(paletteSelector("ocean", "dark"));
    expect(paletteCss("ocean", "dark", tokens)).not.toBe(paletteCss("ocean", "light", tokens));
  });
});

describe("второго вывода селектора в зоне нет", () => {
  it("собранных руками строк `[data-theme=…]` в коде не осталось ни одной", () => {
    // ПОЧЕМУ ПРОБА ИМЕННО ТАКАЯ: правило нарушается не «плохим» селектором, а ВТОРЫМ
    // местом, где он собирается. Пока такое место есть, две дороги живут рядом и однажды
    // разъедутся — как уже разъехались на `:root`.
    const guilty = sources()
      .filter(([name]) => name !== "palette.ts")
      .filter(([, code]) => code.includes("[data-theme") || code.includes(PALETTE_ATTRIBUTE));

    expect(guilty.map(([name]) => name)).toEqual([]);
  });
});
