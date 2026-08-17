// ПРОБА: перечень вариантов — ПУБЛИЧНАЯ ПОВЕРХНОСТЬ, и он стережётся как поверхность.
//
// Вариант выбирает потребитель атрибутом в разметке (`data-variant="outline"`). Значит имя
// варианта — обещание: удалили или переименовали — сломался вид у каждого, кто его поставил.
// Это ровно то обязательство, которое кит дал по зацепкам, только со стороны оформления.
//
// Список ведётся ЗДЕСЬ, руками, и это его объявление. Снятый с CSS перечень подтверждал бы сам
// себя: переименование варианта проехало бы вместе с правкой, а сломался бы вид у потребителя.

import { describe, expect, it } from "vitest";

import { allSkinCss, declarations, skinFile, stripComments } from "./css.js";

/**
 * ОБЪЯВЛЕННЫЕ ВАРИАНТЫ КНОПКИ. Удаление имени — ломающее изменение поставки, добавление —
 * дополнение. Дефолт (без атрибута) в список не входит: он не имя, а поведение по умолчанию.
 */
const BUTTON_VARIANTS = ["soft", "outline", "ghost", "danger", "danger-outline"];

/** ОБЪЯВЛЕННЫЕ РАЗМЕРЫ. Дефолт — средний, тоже без атрибута. */
const BUTTON_SIZES = ["sm", "lg"];

/** Значения атрибута, на которые в оформлении есть правила. */
function declaredIn(css: string, attribute: string): Set<string> {
  const out = new Set<string>();
  for (const [, value] of stripComments(css).matchAll(
    new RegExp(`\\[data-${attribute}="([a-z-]+)"\\]`, "g"),
  )) {
    out.add(value);
  }
  return out;
}

describe("варианты и размеры кнопки", () => {
  const button = () => skinFile("button.css");

  it("каждый объявленный вариант имеет правила", () => {
    const inCss = declaredIn(button(), "variant");
    const missing = BUTTON_VARIANTS.filter((name) => !inCss.has(name));

    expect(missing, "объявлены, но не одеты").toEqual([]);
  });

  it("в оформлении нет вариантов, которых нет в объявлении", () => {
    // Иначе поверхность растёт молча: потребитель находит рабочее имя, ставит его в разметку, а
    // оно нигде не обещано и однажды исчезнет при рефакторинге.
    const inCss = [...declaredIn(button(), "variant")];
    const undeclared = inCss.filter((name) => !BUTTON_VARIANTS.includes(name));

    expect(undeclared, "правила есть, обещания нет").toEqual([]);
  });

  it("каждый объявленный размер имеет правила и наоборот", () => {
    const inCss = declaredIn(button(), "size");

    expect(BUTTON_SIZES.filter((n) => !inCss.has(n)), "объявлены, но не одеты").toEqual([]);
    expect([...inCss].filter((n) => !BUTTON_SIZES.includes(n)), "правила без обещания").toEqual([]);
  });

  it("дефолт живёт БЕЗ атрибута", () => {
    // Простая разметка `<Button>` обязана давать рабочий вид сразу. Если бы основной вариант
    // требовал `data-variant="solid"`, каждый потребитель платил бы за это в каждой кнопке.
    const base = /\[data-slot~="button"\]\s*\{([^}]*)\}/.exec(stripComments(button()))?.[1] ?? "";

    expect(base).toContain("background-color: var(--brand-solid)");
    expect(base).toContain("block-size: var(--control-height-md)");
  });

  it("каждый вариант меняет ЦВЕТ, а не только рамку", () => {
    // Вариант, отличающийся лишь толщиной границы, неразличим на глаз — а различать их и есть
    // его смысл. Проверяем, что у каждого есть собственное объявление цвета или фона.
    const css = stripComments(button());
    const thin: string[] = [];

    for (const name of BUTTON_VARIANTS) {
      const rule = new RegExp(`\\[data-variant="${name}"\\]\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? "";
      const paints = /background-color|(?:^|\s)color:/.test(rule);
      if (!paints) thin.push(name);
    }

    expect(thin, "варианты без собственного цвета").toEqual([]);
  });

  it("отключённое состояние ОДНО на все варианты и стоит последним", () => {
    // Отключённая кнопка обязана выглядеть одинаково, чем бы она ни была: «отключённый danger»
    // остаётся красным и продолжает кричать о действии, которого совершить нельзя. Порядок
    // важен — правило обязано идти ПОСЛЕ вариантов, иначе они его перебьют.
    const css = stripComments(button());
    const disabledAt = css.indexOf('[data-slot~="button"]:disabled');
    const lastVariantAt = Math.max(
      ...BUTTON_VARIANTS.map((name) => css.lastIndexOf(`[data-variant="${name}"]`)),
    );

    expect(disabledAt, "правила для :disabled нет").toBeGreaterThan(0);
    expect(
      disabledAt,
      "правило :disabled стоит ДО вариантов — они его перебьют",
    ).toBeGreaterThan(lastVariantAt);
  });

  it("варианты и размеры не привозят литералов", () => {
    // Та же проверка, что и для всего оформления, но прицельно: варианты добавляются чаще
    // остального, и литерал заезжает именно с ними.
    const bad = declarations(allSkinCss())
      .filter(({ property, value }) => {
        if (!/color|border|background/.test(property)) return false;
        return /#[0-9a-f]{3,8}\b|\brgba?\(/i.test(value);
      })
      .map(({ property, value }) => `${property}: ${value}`);

    expect(bad, "литеральные цвета").toEqual([]);
  });
});
