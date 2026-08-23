// РАЗМЕРНЫЕ ШКАЛЫ СКИНА (`PWEB-64`): значения едут скином, второго пути через общий лист нет.
//
// Гейт задачи в одну строку: **скина нет — значений нет.** Ни запасного значения в генераторе,
// ни `var(--x, …)` как тихой подстраховки: отсутствие значения — состояние, и оно называется.
//
// ## Что здесь проверяется живым документом, а что текстом
//
// Значение ступени — ВЫРАЖЕНИЕ (`calc(var(--space) * 3 * var(--density))`), и посчитать его
// может только браузер. jsdom `var()` внутри кастом-свойства не разрешает — он отдаёт запись как
// есть, — поэтому «сколько получилось» здесь не спрашивается вовсе: на это отвечает проверка
// настоящим браузером (`tools/live-check/`), и её след живёт в узле задачи.
//
// Тексту достаются вопросы, на которые он и отвечает: ЧТО объявлено, чего не объявлено, и нет ли
// в объявленном запасного значения.

import postcss from "postcss";
import { describe, expect, it } from "vitest";

import { withPassports } from "../src/generate.js";
import type { Skin } from "../src/model.js";
import { SIZE_SEEDS, sizeValues } from "../src/sizes.js";
import { lookup } from "./passports.js";

// Источник паспортов называется ОДИН раз (`PWEB-94`): дальше он приезжает связкой.
const { checkSkin, generateSkinCss } = withPassports(lookup);

/** Скин, посеявший интервалы: одно семя плюс плотность. */
const sown: Skin = {
  name: "посеян",
  variables: { dimensions: { space: "0.25rem", density: "1" } },
  recipes: { button: { base: { root: { props: { paddingInline: "var(--space-3)" } } } } },
};

/** Тот же скин, не посеявший НИЧЕГО: правило адресует ступень, которой взяться неоткуда. */
const bare: Skin = {
  name: "гол",
  recipes: { button: { base: { root: { props: { paddingInline: "var(--space-3)" } } } } },
};

/**
 * Имена, объявленные текстом: `--имя` → ВСЕ его значения, в порядке появления.
 *
 * Все, а не последнее: у шкалы с посадкой на сетку имя объявлено дважды намеренно, и проба,
 * которая помнит только последнее, не отличит два объявления от одного.
 */
function declared(css: string): Map<string, string[]> {
  const found = new Map<string, string[]>();
  postcss.parse(css).walkDecls(/^--/, (decl) => {
    found.set(decl.prop, [...(found.get(decl.prop) ?? []), decl.value]);
  });
  return found;
}

describe("посеял семя — получил всю лестницу", () => {
  const css = generateSkinCss(sown);

  it("объявлено и само семя, и все его ступени", () => {
    const names = declared(css);

    expect(names.has("--space")).toBe(true);
    for (const step of ["--space-1", "--space-3", "--space-32"]) expect(names.has(step)).toBe(true);
  });

  it("ступень считается от семени СКИНА, а не от чего-то своего", () => {
    // Ступень обязана остаться выражением: посчитай мы её сами, `rem` замёрз бы в момент
    // порождения, а плотность перестала бы двигать геометрию на контейнере.
    expect(declared(css).get("--space-3")?.[0]).toBe("calc(var(--space) * 3 * var(--density))");
  });

  it("посадка на сетку — ВТОРОЕ объявление того же имени, а не запасное значение", () => {
    // Первым стоит значение без округления: его берёт браузер без `round()` и получает дробное,
    // но живое. Вторым, под `@supports`, — то же самое на сетке. Оба считают одно и то же семя
    // скина, поэтому это не подстраховка значением, а два объявления одной величины.
    const both = declared(css).get("--space-3");

    expect(both).toHaveLength(2);
    expect(both?.[1]).toBe("round(nearest, calc(var(--space) * 3 * var(--density)), 0.25rem)");
    expect(css).toContain("@supports (width: round(nearest, 1rem, 0.25rem))");
  });
});

describe("НЕТ СЕМЕНИ — НЕТ ЗНАЧЕНИЙ", () => {
  it("скин без размерного набора не объявляет ни одной ступени", () => {
    const values = sizeValues(bare);

    expect(values.size).toBe(0);
  });

  it("а правило, адресующее непосеянную ступень, — изъян записи, и порождение отказывает", () => {
    // Главный гейт задачи. Умолчание сбоку здесь именно поэтому и невозможно: подставить нечего,
    // и вместо тихой подстановки человек получает названную причину.
    const flaws = checkSkin(bare);

    expect(flaws.map((flaw) => flaw.name)).toContain("unknown-value");
    expect(() => generateSkinCss(bare)).toThrow(/не порождён/);
  });

  it("ни одно объявление размерного набора не несёт запасного значения", () => {
    // Мутация из задачи: подсунь запасное значение в генератор — краснеет здесь. Проверяется
    // ВЕСЬ вывод, а не одна ступень: подстраховка, добавленная «на всякий случай» в одну шкалу,
    // так же тиха, как добавленная во все.
    for (const [name, values] of declared(generateSkinCss(sown))) {
      for (const value of values) {
        expect(`${name}: ${value}`).not.toMatch(/var\(\s*--[^\s,)]+\s*,/u);
      }
    }
  });
});

describe("что скин назвал неправильно — сказано ему, а не проглочено", () => {
  it("имени шкалы не существует — изъян с перечнем законных семян", () => {
    const skin: Skin = { name: "опечатка", variables: { dimensions: { spacing: "1rem" } }, recipes: {} };
    const flaws = checkSkin(skin);

    expect(flaws.map((flaw) => flaw.name)).toContain("bad-size");
    expect(flaws.find((flaw) => flaw.name === "bad-size")?.means).toContain("space");
  });

  it("шкала плотная, а плотность не названа — изъян, а не исчезнувшая геометрия", () => {
    // Без объявления `--density` браузер выбрасывает ступень целиком: геометрия не ухудшается,
    // а исчезает. Подставить плотность за человека нельзя — это умолчание в обход, — поэтому
    // называем.
    const skin: Skin = { name: "без-плотности", variables: { dimensions: { space: "0.25rem" } }, recipes: {} };

    expect(checkSkin(skin).map((flaw) => flaw.name)).toContain("bad-size");
  });

  it("шкала НЕплотная плотности не требует — требование выведено из данных, а не назначено", () => {
    // `radius` осью плотности не масштабируется (форма не должна плыть вместе с кеглем), и
    // просить за неё плотность было бы придуманным правилом.
    const skin: Skin = { name: "скругление", variables: { dimensions: { radius: "0.5rem" } }, recipes: {} };

    expect(checkSkin(skin)).toEqual([]);
  });
});

describe("перечень семян — у соседа, а не наш список", () => {
  it("законные имена приходят данными зоны значений", () => {
    // Второй список разъехался бы с первым на первой же новой шкале, и правым оказался бы тот,
    // кого спросили последним.
    for (const seed of ["space", "radius", "font-size", "density"]) {
      expect(SIZE_SEEDS).toContain(seed);
    }
  });
});
