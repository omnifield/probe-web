import { describe, expect, it } from "vitest";

import { type ThemeModel, themeModelToCss } from "../src/model.js";
import { buildThemeTokens } from "../src/tokens.js";

// ГЕЙТ ГЕНЕРАТОРА: модель темы → файл. Ради чего он существует — вид ставится ОДНИМ
// указанием, — держится ровно на трёх обещаниях, и каждое проверяется здесь:
//   • из одной и той же модели рождается один и тот же файл (иначе «поставить тему» значит
//     «поставить что-то похожее», и расхождение видно только глазами в приложении);
//   • тёмная пара учитывает правки модели, а светлая остаётся расчётной;
//   • плотность едет в том же блоке, что и остальные значения, — тема не переносится
//     в два приёма.

const MODEL: ThemeModel = {
  id: "ocean",
  seeds: {
    neutral: "oklch(0.62 0.004 248)",
    brand: "oklch(0.55 0.16 248)",
    danger: "oklch(0.505 0.196 27)",
  },
  meta: { radius: "0.75rem" },
  darkOverrides: { "neutral-1": "oklch(0.205 0.008 248)" },
  density: "0.9",
};

const LIGHT = '[data-theme="ocean"]';
const DARK = '[data-theme="ocean"].dark, [data-theme="ocean"] .dark';

/** Значения одного блока в порядке их появления. Блока с таким селектором нет — пусто. */
function block(css: string, selector: string): Map<string, string> {
  const body = css.split(`\n${selector} {\n`)[1]?.split("\n}")[0];
  const values = new Map<string, string>();
  for (const line of body?.split("\n") ?? []) {
    const [, name, value] = /^ {2}--([^:]+): (.*);$/.exec(line) ?? [];
    if (name) values.set(name, value as string);
  }
  return values;
}

describe("themeModelToCss", () => {
  it("из одной и той же модели рождается один и тот же файл", () => {
    const twin: ThemeModel = structuredClone(MODEL);

    expect(themeModelToCss(MODEL)).toBe(themeModelToCss(MODEL));
    expect(themeModelToCss(twin)).toBe(themeModelToCss(MODEL));
  });

  it("светлая пара — ровно то, что база считает из семян и меты", () => {
    const values = block(themeModelToCss(MODEL), LIGHT);
    const expected = buildThemeTokens(MODEL.seeds, "light", MODEL.meta);

    for (const [name, value] of Object.entries(expected)) {
      expect(values.get(name), `ступень --${name}`).toBe(value);
    }
    expect(values.get("radius")).toBe("0.75rem");
  });

  it("плотность стоит в том же блоке, что и остальные значения", () => {
    const css = themeModelToCss(MODEL);

    expect(block(css, LIGHT).get("density")).toBe("0.9");
    // Ни отдельного блока под плотность, ни второй копии в тёмной половине: единственное
    // вхождение — то самое, что лежит рядом со ступенями светлой пары.
    expect(css.match(/--density:/g)).toHaveLength(1);
    expect(block(css, DARK).has("density")).toBe(false);
  });

  it("тёмная пара учитывает правки модели, светлая остаётся расчётной", () => {
    const dark = block(themeModelToCss(MODEL), DARK);
    const light = block(themeModelToCss(MODEL), LIGHT);
    const computed = buildThemeTokens(MODEL.seeds, "dark", MODEL.meta);

    expect(dark.get("neutral-1")).toBe("oklch(0.205 0.008 248)");
    expect(dark.get("neutral-1")).not.toBe(computed["neutral-1"]);
    // Правится ровно названная ступень: соседняя приходит расчётной.
    expect(dark.get("neutral-2")).toBe(computed["neutral-2"]);
    // Правки тёмной пары в светлую не протекают — иначе обещания контраста ничего не значат.
    expect(light.get("neutral-1")).toBe(buildThemeTokens(MODEL.seeds, "light", MODEL.meta)["neutral-1"]);
  });

  it("без правок тёмная пара ровно расчётная", () => {
    const { darkOverrides: _drop, ...plain } = MODEL;
    const dark = block(themeModelToCss(plain), DARK);
    const computed = buildThemeTokens(plain.seeds, "dark", plain.meta);

    for (const [name, value] of Object.entries(computed)) {
      expect(dark.get(name), `ступень --${name}`).toBe(value);
    }
  });

  it("файл подключается атрибутом: селекторы обеих половин и подсказка сверху", () => {
    const css = themeModelToCss(MODEL);

    expect(css.startsWith("/* Тема «ocean»")).toBe(true);
    expect(css).toContain('data-theme="ocean" на <html>');
    expect(css).toContain(`\n${LIGHT} {\n`);
    expect(css).toContain(`\n${DARK} {\n`);
    // Файл заканчивается переводом строки: он уезжает на диск, а не в середину другого.
    expect(css.endsWith("}\n")).toBe(true);
  });

  it("модель принимается в той форме, в какой лежит в службе", () => {
    // Служба отдаёт правки нетипизированным набором — гейт держит совместимость формы,
    // чтобы читателю записи не приходилось преобразовывать её на стыке.
    const fromRecord: Record<string, string> = { "neutral-12": "oklch(0.92 0.006 248)" };
    const model: ThemeModel = { ...MODEL, darkOverrides: fromRecord };

    expect(block(themeModelToCss(model), DARK).get("neutral-12")).toBe(
      "oklch(0.92 0.006 248)",
    );
  });
});
