import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { BASE_MARKER } from "../src/marker.js";
import { themeModelToCss } from "../src/model.js";
import { paletteSelector } from "../src/palette.js";
import { SCALE_TOKENS, THEME_META_TOKENS } from "../src/tokens.js";
import { readBuilt, rules, unthemedRules } from "./helpers/css.js";
import { MODEL, PALETTE, paletteFile } from "./helpers/seeds.js";

// ГЕЙТ МАРКЕРА ПРИЕЗДА БАЗЫ (`tasker:PROBEWEB-78`, контракт — `kb:PROBEWEB-13`).
//
// Пробы держат СВОЙСТВА маркера, а не его сегодняшнее имя: ни одна из них не знает, какой
// именно это токен. Проба на строку сломалась бы при первом законном переименовании и не
// поймала бы настоящую ошибку — маркер, уехавший в палитру. Проба на свойство переживает
// переименование и краснеет ровно на ошибке.
//
// Цена ошибки здесь несимметрична: имя уезжает в скелет, а тот кладётся потребителю
// `placed-once` и не обновляется никогда.
//
// МАРКЕР ПЕРЕЕХАЛ НА СБРОС (`PWEB-66`): кастом-свойств в листе не осталось ни одного, и
// предъявлять приезд стало нечем, кроме самого сброса. Свойства маркера при этом не менялись —
// изменился носитель, и пробы ниже спрашивают ровно те же три вещи.

const SRC = resolve(import.meta.dirname, "..", "src");
const name = BASE_MARKER.property;
const base = readBuilt("base.css");
// Палитра для сверки ПОРОЖДАЕТСЯ фикстурой, а не читается с диска: поставляемой палитры у
// зоны больше нет (`PWEB-50`), и маркер обязан держаться против ЛЮБОЙ палитры, а не против
// той, что мы когда-то отгружали.
const themes = paletteFile();

describe("BASE_MARKER", () => {
  it("это ПАРА: свойство и ожидаемое значение, взять одно без другого нельзя", () => {
    // Условие формы. Свойство без значения — проверка, которая врёт зелёным: `box-sizing` есть
    // у каждого элемента всегда. Две константы рядом дали бы потребителю выбрать имя и забыть
    // значение, поэтому экспорт ОДИН и он неделим.
    expect(BASE_MARKER.property, "у маркера нет свойства").toBeTruthy();
    expect(BASE_MARKER.value, "у маркера нет ожидаемого значения").toBeTruthy();
    expect(Object.isFrozen(BASE_MARKER), "пару можно разобрать на месте").toBe(true);

    // Кастом-свойством маркер быть больше не может: их в листе не осталось ни одного.
    expect(name.startsWith("--"), "маркер снова кастом-свойство — носителя такого в листе нет")
      .toBe(false);
  });

  it("печатается ИМЕНЕМ СВОЙСТВА — так его ищет эталон в тексте листа", () => {
    // Проба стоит здесь, а не в чужой зоне, потому что форма печати — наше обещание. Эталон
    // подставляет маркер в строку и ищет подстроку в собранном CSS; сломай мы печать —
    // покраснеет он, а причина будет тут.
    expect(`${BASE_MARKER}`).toBe(BASE_MARKER.property);
    expect(readBuilt("base.css")).toContain(`${BASE_MARKER}:`);
  });

  it("объявлен собранным `base.css` — иначе он не отвечает на свой вопрос", () => {
    const declared = rules(base).some((rule) => rule.plain.has(name));
    expect(declared, `${name} не объявлен базовым слоем`).toBe(true);
  });

  it("значение из пары — то самое, что стоит в листе", () => {
    // Второй копии значения в зоне нет: и лист, и маркер печатаются из одной записи сброса.
    // Разъедься они — маркер сравнивал бы документ с тем, чего мы не объявляли.
    const values = rules(base)
      .map((rule) => rule.plain.get(name))
      .filter((value): value is string => value !== undefined);

    expect(values.length).toBeGreaterThan(0);
    for (const value of values) expect(value).toBe(BASE_MARKER.value);
  });

  it("ожидаемое значение ОТЛИЧАЕТСЯ от умолчания браузера", () => {
    // Иначе проверка истинна всегда: свойство есть у каждого элемента, и непустой ответ
    // ничего не доказывает. Умолчание `box-sizing` — `content-box`, и разницу видно.
    expect(BASE_MARKER.value).not.toBe("content-box");
  });

  it("НЕ входит в контракт темы — палитра не вправе его объявить", () => {
    // Главное свойство, и держится оно контрактом, а не тем, что сегодня в файле его нет:
    // уехав в палитру, маркер стёр бы разницу между «базы нет» и «палитра не выбрана».
    // Сброс палитрой не объявляется ещё и по построению: палитра несёт значения, а не правила.
    expect([...SCALE_TOKENS, ...THEME_META_TOKENS]).not.toContain(name);
  });

  it("не объявлен ни одной палитрой из того же генератора", () => {
    // Контракт контрактом, а в файл смотрим отдельно: палитра рождается генератором, и
    // проверять надо то, что он выдаёт, а не то, что мы о нём думаем.
    const custom = themeModelToCss({
      ...MODEL,
      id: "ocean",
      meta: { radius: "1.3rem" },
      darkOverrides: { "neutral-1": "oklch(0.205 0.008 248)" },
    });

    for (const [what, css] of [
      ["фикстура", themes],
      ["произвольная палитра", custom],
    ] as const) {
      const painted = rules(css).filter((rule) => rule.plain.has(name));
      expect(painted.map((rule) => rule.selector), `маркер объявлен палитрой (${what})`).toEqual(
        [],
      );
    }
  });

  it("находится на документе БЕЗ палитры — иначе `no-skin` не отличить от `missing-base`", () => {
    // Документ без `data-theme` — законное состояние: красить нечему, но база приехала.
    const declared = unthemedRules(base, themes).some((rule) => rule.plain.has(name));
    expect(declared, `${name} не виден документу без палитры`).toBe(true);
  });

  it("его значение не зависит ни от палитры, ни от режима: ни одного `var()`", () => {
    const values = unthemedRules(base, themes)
      .map((rule) => rule.plain.get(name))
      .filter((value): value is string => value !== undefined);

    expect(values.length).toBeGreaterThan(0);
    for (const value of values) {
      expect(value, `значение ${name} зависит от палитры`).not.toContain("var(");
    }
  });

  it("объявлен безусловно — браузер, не поддержавший условие, тоже его видит", () => {
    // Маркер под `@supports` означал бы, что «база не приехала» слышит тот, у кого база как
    // раз приехала, — просто движок постарше.
    const unconditional = rules(base).filter(
      (rule) => rule.plain.has(name) && !rule.selector.startsWith("@"),
    );

    expect(unconditional.length, `${name} объявлен только под условием`).toBeGreaterThan(0);
  });

  it("второй копии значения в зоне нет — и лист, и маркер печатаются из одной записи", () => {
    // Условие задачи, и держится оно обходом исходников, а не обещанием. Значение, выписанное
    // где-нибудь ещё литералом, разъедется с записью сброса молча: лист останется прежним, а
    // маркер начнёт сравнивать документ с тем, чего мы не объявляли.
    //
    // Комментарии вырезаны: объяснить решение, не назвав значения, нельзя, и объяснение не
    // должно само себя красить.
    const sources = readdirSync(SRC, { recursive: true, encoding: "utf8" })
      .filter((name) => typeof name === "string" && name.endsWith(".ts"))
      .map((name) => [
        name,
        readFileSync(resolve(SRC, name as string), "utf8").replace(
          /\/\/[^\n]*|\/\*[\s\S]*?\*\//g,
          "",
        ),
      ] as const);

    // Считаем ВХОЖДЕНИЯ, а не файлы: замером показано, что вторая копия заводится ровно там
    // же, где первая, — в шаблоне листа рядом с записью (`${RESET_PROOF.property}: border-box`).
    // Проверка по файлам такую копию пропускала.
    const found = sources.flatMap(([name, code]) =>
      [...code.matchAll(new RegExp(BASE_MARKER.value, "g"))].map(() => name),
    );

    expect(found, "значение сброса записано больше чем один раз").toEqual(["css/written.ts"]);
  });

  it("палитра поверх базы маркер НЕ перекрывает — проверено на обоих селекторах палитры", () => {
    for (const mode of ["light", "dark"] as const) {
      const rule = rules(themes).find(
        (item) => item.selector === paletteSelector(PALETTE, mode),
      );
      expect(rule?.declarations.has(name), `палитра (${mode}) перебивает маркер`).toBe(false);
    }
  });
});
