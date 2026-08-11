// Пути: сборка наших строк и разведка чужих. Разведка — то, что делает перемап работой
// мышкой, а не набором `/data/items/0/client_name` без опечатки.

import { describe, expect, it } from "vitest";

import { assign, discoverPaths, discoverRowPaths, discoverRowSets, pointerOf } from "../src/adapter/paths.js";

describe("сборка строки", () => {
  it("кладёт значение по пути", () => {
    expect(assign({}, "/applicant", "Иванов")).toEqual({ applicant: "Иванов" });
  });

  it("достраивает вложенность", () => {
    expect(assign({}, "/contact/phone", "+7")).toEqual({ contact: { phone: "+7" } });
  });

  it("не затирает соседей в той же ветке", () => {
    const first = assign({}, "/contact/phone", "+7");
    expect(assign(first, "/contact/email", "a@b")).toEqual({
      contact: { phone: "+7", email: "a@b" },
    });
  });

  it("исходную строку НЕ трогает — адаптер только читает источник", () => {
    const before = { contact: { phone: "+7" } };
    const after = assign(before, "/contact/email", "a@b");

    expect(before).toEqual({ contact: { phone: "+7" } });
    expect(after).not.toBe(before);
  });

  it("пустой путь никуда не кладёт", () => {
    expect(assign({ a: 1 }, "", "что-то")).toEqual({ a: 1 });
  });

  it("имя с косой чертой внутри собирается экранированным", () => {
    expect(pointerOf(["a/b"])).toBe("/a~1b");
    expect(assign({}, pointerOf(["a/b"]), 1)).toEqual({ "a/b": 1 });
  });
});

describe("разведка чужого ответа", () => {
  const response = {
    ok: true,
    data: {
      items: [
        { client: { last: "Иванов" }, amount_cents: "125000", tags: ["срочно"] },
        { client: { last: "Петров" }, amount_cents: "70000" },
      ],
    },
  };

  it("находит места, похожие на набор строк", () => {
    // Заворачивают все по-разному, и угадывать `/data/items` руками — самая частая ошибка.
    expect(discoverRowSets(response)).toEqual(["/data/items"]);
  });

  it("перечисляет пути ВНУТРИ строки набора", () => {
    const paths = discoverRowPaths(response, "/data/items");

    expect(paths).toContain("/client/last");
    expect(paths).toContain("/amount_cents");
    expect(paths).toContain("/client");
  });

  it("у массива смотрит первый элемент, а не перечисляет все", () => {
    // Иначе на тысяче строк человек получит тысячу одинаковых путей.
    // Сам элемент массива путём не считается — путями становятся его ПОЛЯ.
    expect(discoverPaths({ list: [{ a: 1 }, { b: 2 }] })).toEqual(["/list", "/list/0/a"]);
  });

  it("не уходит вглубь дальше предела", () => {
    const deep = { a: { b: { c: { d: { e: 1 } } } } };
    expect(discoverPaths(deep, 2)).toEqual(["/a", "/a/b"]);
  });

  it("пустой ответ — пустой список, а не поломка", () => {
    expect(discoverRowSets(null)).toEqual([]);
    expect(discoverRowPaths({}, "/nope")).toEqual([]);
  });
});
