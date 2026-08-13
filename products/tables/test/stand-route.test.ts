// Маршрут стенда: разбор адреса — чистая функция, и проверяется он строками, а не рендером.
//
// Смысл проб — не «хеш парсится», а два свойства, на которых держится стенд: чужая ссылка с
// мусором открывает стенд, а не пустой экран; и адрес страницы собирается ровно в одном месте.

import { describe, expect, it } from "vitest";

import { hashOf, PAGES, pageMeta, parseRoute, START } from "../src/playground/route.js";

describe("состав стенда", () => {
  it("страницы объявлены данными и не повторяются", () => {
    expect(PAGES.length).toBeGreaterThanOrEqual(2);
    expect(new Set(PAGES.map((page) => page.id)).size).toBe(PAGES.length);
    expect(new Set(PAGES.map((page) => page.hash)).size).toBe(PAGES.length);
  });

  it("у каждой страницы есть подпись, заголовок и объяснение", () => {
    for (const page of PAGES) {
      expect(page.nav.length).toBeGreaterThan(0);
      expect(page.title.length).toBeGreaterThan(0);
      expect(page.lead.length).toBeGreaterThan(0);
    }
  });

  it("отдельной страницы «таблица» НЕТ: управление колонкой живёт в самой колонке", () => {
    expect(PAGES.some((page) => page.id === ("table" as string))).toBe(false);
  });
});

describe("разбор адреса", () => {
  it("читает свой адрес — с решёткой и без неё", () => {
    for (const page of PAGES) {
      expect(parseRoute(page.hash)).toBe(page.id);
      expect(parseRoute(page.hash.replace("#", ""))).toBe(page.id);
      expect(parseRoute(`#${page.id}`)).toBe(page.id);
    }
  });

  it("хвост после первого сегмента не мешает", () => {
    expect(parseRoute("#/filters/что-то/ещё")).toBe("filters");
    expect(parseRoute("#/filters?режим=1")).toBe("filters");
  });

  it("неизвестный и пустой адрес открывают стартовую страницу, а не пустой экран", () => {
    expect(parseRoute("")).toBe(START);
    expect(parseRoute("#")).toBe(START);
    expect(parseRoute("#/такой-страницы-нет")).toBe(START);
    expect(parseRoute("#///")).toBe(START);
  });

  it("адрес собирается в одном месте и разбирается обратно в ту же страницу", () => {
    for (const page of PAGES) {
      expect(parseRoute(hashOf(page.id))).toBe(page.id);
      expect(pageMeta(page.id).hash).toBe(hashOf(page.id));
    }
  });
});
