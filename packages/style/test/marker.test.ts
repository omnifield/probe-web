import { describe, expect, it } from "vitest";

import { BASE_MARKER } from "../src/marker.js";
import { DEFAULT_THEME_MODEL, themeModelToCss } from "../src/model.js";
import { DEFAULT_PALETTE, paletteSelector } from "../src/palette.js";
import { SCALE_TOKENS, THEME_META_TOKENS } from "../src/tokens.js";
import { readBuilt, rules, unthemedRules } from "./helpers/css.js";

// ГЕЙТ МАРКЕРА ПРИЕЗДА БАЗЫ (`tasker:PROBEWEB-78`, контракт — `kb:PROBEWEB-13`).
//
// Пробы держат СВОЙСТВА маркера, а не его сегодняшнее имя: ни одна из них не знает, какой
// именно это токен. Проба на строку сломалась бы при первом законном переименовании и не
// поймала бы настоящую ошибку — маркер, уехавший в палитру. Проба на свойство переживает
// переименование и краснеет ровно на ошибке.
//
// Цена ошибки здесь несимметрична: имя уезжает в скелет, а тот кладётся потребителю
// `placed-once` и не обновляется никогда.

const name = BASE_MARKER.slice(2);
const base = readBuilt("base.css");
const themes = readBuilt("themes.css");

describe("BASE_MARKER", () => {
  it("это готовое кастом-свойство: чужая проверка отказывает на имени без `--`", () => {
    // `checkStyleOrder()` (`runtime`) ждёт имя с двумя дефисами и на другом бросает сразу:
    // проверка, которая НИКОГДА не найдёт маркер, кричала бы на исправном приложении.
    expect(BASE_MARKER.startsWith("--")).toBe(true);
    expect(name.length).toBeGreaterThan(0);
  });

  it("объявлен собранным `base.css` — иначе он не отвечает на свой вопрос", () => {
    const declared = rules(base).some((rule) => rule.declarations.has(name));
    expect(declared, `--${name} не объявлен базовым слоем`).toBe(true);
  });

  it("НЕ входит в контракт темы — палитра не вправе его объявить", () => {
    // Главное свойство, и держится оно контрактом, а не тем, что сегодня в файле его нет:
    // токен вне контракта темы не может приехать ни с одной палитрой — ни с нашей, ни с
    // чужой. Уехав в палитру, маркер стёр бы разницу между «базы нет» и «палитра не
    // выбрана», а `runtime` различает ровно эти два состояния.
    expect([...SCALE_TOKENS, ...THEME_META_TOKENS]).not.toContain(name);
  });

  it("не объявлен ни поставляемой палитрой, ни любой другой из того же генератора", () => {
    // Вторая сторона того же: контракт контрактом, а в файл смотрим отдельно — палитра
    // рождается генератором, и проверять надо то, что он выдаёт, а не то, что мы о нём
    // думаем. Берём и дефолтную палитру из поставки, и произвольную с мета и правками.
    const custom = themeModelToCss({
      ...DEFAULT_THEME_MODEL,
      id: "ocean",
      meta: { radius: "1.3rem" },
      darkOverrides: { "neutral-1": "oklch(0.205 0.008 248)" },
    });

    for (const [what, css] of [
      ["поставка", themes],
      ["произвольная палитра", custom],
    ] as const) {
      const painted = rules(css).filter((rule) => rule.declarations.has(name));
      expect(painted.map((rule) => rule.selector), `маркер объявлен палитрой (${what})`).toEqual(
        [],
      );
    }
  });

  it("находится на документе БЕЗ палитры — иначе `no-skin` не отличить от `missing-base`", () => {
    // После `kb:PROBEWEB-18` документ без `data-theme` — законное состояние: красить нечему,
    // но база приехала. Маркер обязан находиться именно там, иначе механика скажет «порядок
    // нарушен» приложению, которое всего лишь не выбрало пресет.
    const declared = unthemedRules(base, themes).some((rule) => rule.declarations.has(name));
    expect(declared, `--${name} не виден документу без палитры`).toBe(true);
  });

  it("его значение не зависит от палитры: ни одного `var()` внутри", () => {
    // Токен, посчитанный из семени, разрешился бы через фолбэк и годился бы тоже. Но маркер
    // с `var()` отвечает сразу на два вопроса, и разбираться, какой из них дал пустую
    // строку, придётся в чужой зоне.
    const values = unthemedRules(base, themes)
      .map((rule) => rule.declarations.get(name))
      .filter((value): value is string => value !== undefined);

    expect(values.length).toBeGreaterThan(0);
    for (const value of values) expect(value, `значение --${name} зависит от палитры`).not.toContain("var(");
  });

  it("объявлен безусловно — браузер, не поддержавший условие, тоже его видит", () => {
    // Маркер под `@supports` означал бы, что «база не приехала» слышит тот, у кого база как
    // раз приехала, — просто движок постарше.
    const unconditional = rules(base).filter(
      (rule) => rule.declarations.has(name) && !rule.selector.startsWith("@"),
    );

    expect(unconditional.length, `--${name} объявлен только под условием`).toBeGreaterThan(0);
  });

  it("палитра поверх базы маркер НЕ перекрывает — проверено на обоих селекторах палитры", () => {
    for (const mode of ["light", "dark"] as const) {
      const rule = rules(themes).find(
        (item) => item.selector === paletteSelector(DEFAULT_PALETTE, mode),
      );
      expect(rule?.declarations.has(name), `палитра (${mode}) перебивает маркер`).toBe(false);
    }
  });
});
