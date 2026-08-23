// ОБКАТКА НА КНОПКЕ — сквозной проход на ЖИВОМ ките: кнопка одевается, раздевается и работает
// без скина вовсе.
//
// Здесь проверяется то, чего не видно в тексте: что порождённый селектор цепляется за
// НАСТОЯЩИЙ узел настоящего компонента. Проба, сверяющая строки, зелёная и тогда, когда кит
// перестал ставить адресные атрибуты, — а это ровно тот отказ, из-за которого весь скин
// перестаёт существовать.
//
// Кнопка выбрана не за простоту: у Ark её нет, потому что безголовая кнопка — нативный элемент.
// Значит форма проверяется на компоненте, которого в чужом ките не существует, и подойдёт
// любому (страница «Основания»).
//
// Про слои каскада и полифил — см. шапку `cascade.test.ts`: jsdom их не понимает, поэтому текст
// прогоняется через стандартный полифил. Полифил — проверка, а не поставка. По той же причине
// текст здесь ещё и разворачивается: вложенности jsdom тоже не знает.

import layers from "@csstools/postcss-cascade-layers";
import { Button } from "@omnifield/probe-web-ui";
import { passportOf } from "@omnifield/probe-web-ui/passport";
import postcss, { type Rule } from "postcss";
import { afterEach, describe, expect, it } from "vitest";

import { flattenCss } from "../src/flatten.js";
import { withPassports } from "../src/generate.js";
import { FORCE_ATTRIBUTE } from "../src/marks.js";
import { partSelector } from "../src/address.js";
import { lookup } from "./passports.js";
import { buttonSkin } from "./skins.js";
import { cleanup, mount } from "./dom.jsx";

// Источник паспортов называется ОДИН раз (`PWEB-94`): дальше он приезжает связкой.
const { generateSkinCss } = withPassports(lookup);

afterEach(cleanup);

const passport = passportOf("button")!;
// Развёрнуто намеренно: генератор отдаёт вложенную форму, а jsdom не понимает ни вложенности,
// ни слоёв. Оба разворота — ограничение окружения пробы, а не поставки; в браузере вложенная
// форма работает как есть.
const skinCss = flattenCss(generateSkinCss(buttonSkin));

/** Селекторы порождённого скина — те, что относятся к координатам, а не к корню документа. */
const selectors: string[] = [];
postcss.parse(skinCss).walkRules((rule: Rule) => {
  if (rule.parent?.type === "atrule" && (rule.parent as { name: string }).name === "keyframes") {
    return;
  }
  if (!rule.selector.startsWith(":root")) selectors.push(rule.selector);
});

/** Надевает скин обычным листом стилей — так же, как это делает `runtime`. */
function wear(css: string): HTMLStyleElement {
  const sheet = document.createElement("style");
  sheet.textContent = postcss([layers()]).process(css, { from: undefined }).css;
  document.head.append(sheet);
  return sheet;
}

/** Кнопка, смонтированная с заданными пропами. */
function button(props: Record<string, string> = {}): HTMLElement {
  const host = mount(() => <Button {...props}>Сохранить</Button>);
  return host.querySelector("button")!;
}

describe("кнопка адресуема тем, что порождено", () => {
  it("живой узел несёт ровно ту координату, из которой собран селектор", () => {
    expect(button().matches(partSelector(passport, "root")!)).toBe(true);
  });

  it("базовое правило и умолчание цепляются за ГОЛУЮ кнопку — без атрибута вариации", () => {
    const node = button();
    const matched = selectors.filter((selector) => node.matches(selector));

    expect(matched).toContain(partSelector(passport, "root"));
    expect(matched.some((selector) => selector.includes(":not([data-variant])"))).toBe(true);
  });

  it("названная вариация цепляется, а чужая — нет", () => {
    const node = button({ "data-variant": "опасная" });

    expect(selectors.some((s) => node.matches(s) && s.includes('"опасная"'))).toBe(true);
    expect(selectors.some((s) => node.matches(s) && s.includes('"тихая"'))).toBe(false);
  });

  it("умолчание НЕ цепляется, когда стоит другое имя: адрес один, но не «любой»", () => {
    const node = button({ "data-variant": "тихая" });
    const дефолт = selectors.find((s) => s.includes('"главная"'))!;

    expect(node.matches(дефолт)).toBe(false);
  });

  it("атрибутное состояние цепляется настоящим атрибутом", () => {
    const node = button({ "data-disabled": "" });
    const rule = selectors.find((s) => s.includes("[data-disabled]") && !s.includes(":hover"))!;

    expect(node.matches(rule)).toBe(true);
  });
});

describe("принудительный признак показывает то, чего данными не выставить", () => {
  const hover = () => selectors.find((s) => s.includes(":hover") && !s.includes("[data-disabled]"))!;

  it("без признака правило наведения не цепляется — браузер наведения не видит", () => {
    expect(button().matches(hover())).toBe(false);
  });

  it("с признаком цепляется ТО ЖЕ правило: второго генератора нет", () => {
    expect(button({ [FORCE_ATTRIBUTE]: "hover" }).matches(hover())).toBe(true);
  });

  it("признак перечисляет состояния: одно значение не отменяет остальных", () => {
    const node = button({ [FORCE_ATTRIBUTE]: "hover focus-visible" });
    const focus = selectors.find((s) => s.includes(":focus-visible"))!;

    expect(node.matches(hover())).toBe(true);
    expect(node.matches(focus)).toBe(true);
  });

  it("чужое имя в признаке ничего не включает", () => {
    expect(button({ [FORCE_ATTRIBUTE]: "выдумано" }).matches(hover())).toBe(false);
  });
});

/**
 * Фон, которого НЕТ.
 *
 * jsdom печатает начальное значение свойства, а не пустую строку, и `transparent` из правила даёт
 * ровно ту же запись. Поэтому «голая» проверяется этим значением, а «одета, но прозрачна» —
 * соседним свойством, которое у голой кнопки отсутствует.
 */
const BARE = "rgba(0, 0, 0, 0)";

/**
 * Раскладка ГОЛОЙ кнопки — та, что приходит от самого браузера, а не от нас.
 *
 * Голый кит это не «пусто»: нативная кнопка имеет вид по умолчанию, и скин его меняет. Проба
 * сравнивает именно с ним — сравнение с пустотой было бы неправдой о том, что такое голая кнопка.
 */
const BARE_DISPLAY = "inline-block";

describe("сквозной проход: одета → раздета → работает без скина", () => {
  it("без скина кнопка ГОЛАЯ, и это рабочее состояние продукта", () => {
    const node = button();

    expect(getComputedStyle(node).backgroundColor).toBe(BARE);
    expect(getComputedStyle(node).display).toBe(BARE_DISPLAY);
    expect(node.textContent).toBe("Сохранить");
  });

  it("скин надет — кнопка одета", () => {
    const node = button();
    wear(skinCss);

    expect(getComputedStyle(node).backgroundColor).toBe("rgb(1, 2, 3)");
    expect(getComputedStyle(node).display).toBe("inline-flex");
  });

  it("скин снят — кнопка снова голая, и ничего не сломалось", () => {
    const node = button();
    const sheet = wear(skinCss);

    expect(getComputedStyle(node).backgroundColor).toBe("rgb(1, 2, 3)");

    sheet.remove();

    expect(getComputedStyle(node).backgroundColor).toBe(BARE);
    expect(getComputedStyle(node).display).toBe(BARE_DISPLAY);
    expect(node.isConnected).toBe(true);
    expect(node.textContent).toBe("Сохранить");
  });

  it("кнопка одета ЦЕЛИКОМ: вариация и состояние приезжают тем же листом", () => {
    const node = button({ "data-variant": "тихая", [FORCE_ATTRIBUTE]: "hover" });
    wear(skinCss);

    const computed = getComputedStyle(node);

    // База приехала — значит лист работает; заливка при этом прозрачная, потому что вариация
    // «тихая» перебила умолчание, а не потому, что скина нет.
    expect(computed.display).toBe("inline-flex");
    expect(computed.backgroundColor).toBe(BARE);
    expect(computed.opacity).toBe("0.9");
  });
});
