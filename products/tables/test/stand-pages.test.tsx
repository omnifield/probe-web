// Стенд целиком, рендером в документ: две страницы, переключатель показа на каждой и одно
// состояние на всё.
//
// Проверяется не красота, а три утверждения, ради которых стенд разрезали:
//   • страницы разные — на «Переходнике» нет конструктора отбора, на «Фильтрах» нет выбора
//     формы данных (иначе разрезали только на словах);
//   • показ переключается НА КАЖДОЙ странице;
//   • разрезан экран, а не данные — переход между страницами ничего не сбрасывает.

import { afterEach, describe, expect, it } from "vitest";

import { App } from "../src/playground/app.jsx";
import { PAGES } from "../src/playground/route.js";
import { all, cleanup, mount, one, press } from "./dom.jsx";

afterEach(() => {
  cleanup();
  globalThis.location.hash = "";
});

/** Ссылка навигации по подписи страницы. */
const navLink = (host: ParentNode, nav: string) =>
  all(host, ".page__nav-link").find((node) => node.textContent?.trim() === nav)!;

const current = (host: ParentNode) => one(host, '[aria-current="page"]').textContent?.trim();

const chartRadio = (host: ParentNode) =>
  all<HTMLInputElement>(host, '[data-stand="view-switch"] input')[1]!;

describe("навигация", () => {
  it("в навигации ровно объявленные страницы, и текущая помечена", () => {
    const host = mount(() => <App />);

    expect(all(host, ".page__nav-link").map((node) => node.textContent?.trim())).toEqual(
      PAGES.map((page) => page.nav),
    );
    expect(current(host)).toBe(PAGES[0]!.nav);
  });

  it("переход меняет страницу и адрес — ссылкой делятся, «назад» работает", () => {
    const host = mount(() => <App />);

    press(navLink(host, "Фильтры"));

    expect(current(host)).toBe("Фильтры");
    expect(globalThis.location.hash).toBe("#/filters");
  });

  it("шапка одинакова на всех страницах — под ней ничего не прыгает при переходе", () => {
    const host = mount(() => <App />);
    const before = one(host, ".page__head").textContent;

    press(navLink(host, "Фильтры"));

    // Заголовок и объяснение страницы живут в содержимом, а не в шапке: иначе шапка меняла бы
    // высоту на каждом переходе и всё под ней уезжало бы вверх-вниз.
    expect(one(host, ".page__head").textContent).toBe(before);
    expect(one(host, ".page__main").textContent).toContain(PAGES[1]!.title);
  });

  it("стенд открывается на той странице, что стоит в адресе", () => {
    globalThis.location.hash = "#/filters";
    const host = mount(() => <App />);

    expect(current(host)).toBe("Фильтры");
    expect(host.querySelector('[data-slot="filter-builder"]')).not.toBeNull();
  });
});

describe("страницы разговаривают о разном", () => {
  it("«Переходник» — про вход: выбор формы и конструктор, без конструктора отбора", () => {
    const host = mount(() => <App />);

    expect(host.querySelector('[data-slot="adapter-builder"]')).not.toBeNull();
    expect(host.querySelector('input[name="source"]')).not.toBeNull();
    expect(host.querySelector('[data-slot="filter-builder"]')).toBeNull();
  });

  it("«Фильтры» — про отбор: конструктор есть, выбора формы данных нет", () => {
    const host = mount(() => <App />);

    press(navLink(host, "Фильтры"));

    expect(host.querySelector('[data-slot="filter-builder"]')).not.toBeNull();
    expect(host.querySelector('[data-slot="adapter-builder"]')).toBeNull();
    expect(host.querySelector('input[name="source"]')).toBeNull();
  });
});

describe("показ переключается на каждой странице", () => {
  it.each(PAGES.map((page) => [page.nav] as const))("«%s» — таблица и график", (nav) => {
    const host = mount(() => <App />);
    press(navLink(host, nav));

    expect(host.querySelector('[data-stand="table"]')).not.toBeNull();
    expect(host.querySelector('[data-stand="chart"]')).toBeNull();

    chartRadio(host).click();

    expect(host.querySelector('[data-stand="chart"]')).not.toBeNull();
    expect(host.querySelector('[data-stand="table"]')).toBeNull();
  });
});

describe("разрезан экран, а не данные", () => {
  it("выбранный способ показа переживает переход между страницами", () => {
    const host = mount(() => <App />);

    chartRadio(host).click();
    press(navLink(host, "Фильтры"));

    expect(host.querySelector('[data-stand="chart"]')).not.toBeNull();
  });

  it("отбор, поставленный на «Фильтрах», виден в итоге и на «Переходнике»", () => {
    const host = mount(() => <App />);
    press(navLink(host, "Фильтры"));

    // Готовый кейс из сайдбара — тот же путь, которым пользуется человек.
    press(one(host, ".page__case"));
    const selected = one(host, ".page__result .page__count").textContent;

    press(navLink(host, "Переходник"));

    expect(one(host, ".page__result .page__count").textContent).toBe(selected);
    expect(host.querySelector(".page__phrase")).not.toBeNull();
  });
});

describe("управление колонками — в самой таблице", () => {
  it("ряд управления стоит в заголовках, отдельной панели колонок нет", () => {
    const host = mount(() => <App />);

    expect(all(host, '[data-slot="table-column-menu"]').length).toBeGreaterThan(0);
    // Отдельная панель колонок — отвергнутая раскладка, и сторожим ОБА её имени: то, под
    // которым она когда-то жила, и то, которое она получила бы в нынешнем пространстве имён.
    expect(host.querySelector('[data-slot="column-controls"]')).toBeNull();
    expect(host.querySelector('[data-slot="table-column-controls"]')).toBeNull();
  });

  it("скрытая колонка возвращается из списка скрытых", () => {
    const host = mount(() => <App />);

    const before = all(host, '[data-slot="table-header"]').length;
    press(one(host, '[data-slot="table-header"] [data-slot="table-column-hide"]'));

    expect(all(host, '[data-slot="table-header"]').length).toBe(before - 1);

    press(one(host, '[data-slot="table-column-show"]'));

    expect(all(host, '[data-slot="table-header"]').length).toBe(before);
  });
});

describe("запрос для бэка — под таблицей", () => {
  it("блок стоит под таблицей и показывает тот же отбор, что применён", () => {
    const host = mount(() => <App />);

    press(navLink(host, "Фильтры"));
    press(one(host, ".page__case"));

    const sql = one(host, '[data-stand="sql-text"]').textContent ?? "";
    expect(sql).toContain("SELECT * FROM applications");
    expect(sql).toContain("WHERE");
    // Значения — параметрами, отдельным списком: так они и поедут.
    expect(all(host, '[data-stand="sql-params"] li').length).toBeGreaterThan(0);
  });

  it("на графике запрос ДРУГОЙ: тот же отбор, но со сведением", () => {
    const host = mount(() => <App />);
    chartRadio(host).click();

    const sql = one(host, '[data-stand="sql-text"]').textContent ?? "";
    // Графику нужны сведённые величины, а не строки: бэк должен увидеть это заранее.
    expect(sql).toContain("GROUP BY");
    expect(sql).toContain("AS value");
    expect(sql).not.toContain("SELECT *");
  });

  it("сортировка уезжает в запрос хвостом", () => {
    const host = mount(() => <App />);

    press(one(host, "[data-slot='table-header'] [data-slot='table-header-sort']"));

    expect(one(host, '[data-stand="sql-text"]').textContent).toContain("ORDER BY");
  });
});
