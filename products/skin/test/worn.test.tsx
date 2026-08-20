// НАДЕТ И СНЯТ — вторая половина гейта (`PWEB-31`).
//
// Проверяется путь целиком, настоящей механикой приложения: источник зоны отдаёт текст, механика
// кладёт его в свой лист и ставит опознание на корень; снятие убирает и то, и другое.
//
// ## Где проходит честная граница этой пробы
//
// Мы проверяем, что скин НАДЕТ и что он адресует нарисованную кнопку, — но не вычисленный
// браузером цвет. Причина названа прямо: jsdom каскадные слои не понимает и правила внутри
// `@layer` игнорирует целиком, а порождение всегда заворачивает вывод в слой. Ставить сюда
// полифил слоёв значило бы проверять полифил.
//
// Поэтому здесь: лист стоит, в нём правило нашей КООРДИНАТЫ, на корне опознание, а на узле —
// адресные атрибуты, за которые это правило и цепляется. Совпадение этих двух адресов и есть
// то, что делает кнопку одетой; как оно выглядит — смотрит человек в живом браузере.

import { RenderTree } from "@omnifield/probe-web-assembly";
import { afterEach, describe, expect, it } from "vitest";

import { BUTTON_CASES } from "../src/showcase/cases.js";
import { REGISTRY } from "../src/showcase/registry.js";
import { SKIN_SOURCE } from "../src/skins/index.js";
import { cleanup, mount } from "./dom.jsx";

/** Переключатель заводится на КАЖДУЮ пробу свой: память выбора общая на документ. */
async function wearing() {
  const { makeSkinSwitch } = await import("@omnifield/probe-web-runtime");
  return makeSkinSwitch(SKIN_SOURCE);
}

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute("data-skin");
  for (const sheet of document.querySelectorAll("style")) sheet.remove();
  localStorage.clear();
});

/** Текст всех листов документа — то, что реально доехало до страницы. */
function sheets(): string {
  return [...document.querySelectorAll("style")].map((node) => node.textContent ?? "").join("\n");
}

describe("скин надевается", () => {
  it("лист с правилами приезжает в документ", async () => {
    const skin = await wearing();

    await skin.wear("graphite");

    expect(sheets()).toContain('[data-scope="button"][data-part="root"]');
  });

  it("на корне появляется опознание", async () => {
    const skin = await wearing();

    await skin.wear("graphite");

    expect(document.documentElement.getAttribute("data-skin")).toBe("graphite");
    expect(skin.worn()).toBe("graphite");
  });

  it("правило цепляется за узел, который рисует витрина", async () => {
    const skin = await wearing();
    await skin.wear("graphite");

    const base = BUTTON_CASES[0];
    const host = mount(() => <RenderTree tree={base?.tree} registry={REGISTRY} />);
    const node = host.querySelector('[data-scope="button"][data-part="root"]');

    expect(node).not.toBeNull();
    // Тот же адрес с обеих сторон: на узле — атрибутами, в листе — селектором. Они порождены из
    // ОДНОГО объявления анатомии, и разъехаться им негде по построению.
    expect(sheets()).toContain('[data-scope="button"][data-part="root"]');
  });

  it("вариации и состояния адресованы теми же координатами", async () => {
    const skin = await wearing();

    await skin.wear("graphite");

    const css = sheets();

    expect(css).toContain('[data-variant="опасная"]');
    expect(css).toContain("[data-disabled]");
    expect(css).toContain("data-force");
  });
});

describe("скин снимается", () => {
  it("лист уходит, опознание уходит, остаётся голый кит", async () => {
    const skin = await wearing();
    await skin.wear("graphite");

    skin.takeOff();

    expect(sheets()).not.toContain('[data-scope="button"]');
    expect(document.documentElement.hasAttribute("data-skin")).toBe(false);
    expect(skin.worn()).toBeNull();
  });

  it("кнопка после снятия жива и адресуема — голое это рабочее состояние", async () => {
    const skin = await wearing();
    await skin.wear("graphite");
    skin.takeOff();

    const base = BUTTON_CASES[0];
    const host = mount(() => <RenderTree tree={base?.tree} registry={REGISTRY} />);
    const node = host.querySelector('[data-scope="button"][data-part="root"]');

    expect(node).not.toBeNull();
    expect(node?.textContent).toContain("Сохранить");
  });
});

describe("источник зоны", () => {
  it("отдаёт текст стилей, а не адрес файла", async () => {
    const css = await SKIN_SOURCE.css("graphite");

    expect(css).toContain("@layer");
    expect(css).not.toMatch(/^https?:|\.css$/);
  });

  it("на неизвестное имя отказывает, а не отдаёт пустоту", async () => {
    await expect(async () => SKIN_SOURCE.css("нет-такого")).rejects.toThrow();
  });

  it("перечень имён — из записей зоны", async () => {
    expect([...(await SKIN_SOURCE.names())]).toEqual(["graphite"]);
  });
});
