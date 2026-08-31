import { describe, expect, it } from "vitest";

import { assign, discoverPaths, lookup, pointerOf } from "../src/paths.js";

describe("lookup", () => {
  it("находит вложенное значение по JSON Pointer", () => {
    expect(lookup({ a: { b: [10, 20] } }, "/a/b/1")).toEqual({ found: true, value: 20 });
  });

  it("пустой путь — сами данные целиком", () => {
    const data = { a: 1 };
    expect(lookup(data, "")).toEqual({ found: true, value: data });
  });

  it("путь мимо — found: false, не бросок", () => {
    expect(lookup({ a: 1 }, "/b")).toEqual({ found: false, value: undefined });
    expect(lookup({ a: [1] }, "/a/9")).toEqual({ found: false, value: undefined });
    expect(lookup({ a: 1 }, "/a/b")).toEqual({ found: false, value: undefined });
  });

  it("экранирование ~0/~1 читается обратно", () => {
    expect(lookup({ "a/b": { "c~d": 5 } }, pointerOf(["a/b", "c~d"]))).toEqual({ found: true, value: 5 });
  });
});

describe("assign", () => {
  it("достраивает вложенность — мутирует и возвращает ТОТ ЖЕ аккумулятор (свой, не чужие данные)", () => {
    const row = { a: { x: 1 } };
    const result = assign(row, "/a/y", 2);

    expect(result).toBe(row);
    expect(row).toEqual({ a: { x: 1, y: 2 } });
  });
});

describe("discoverPaths", () => {
  it("перечисляет пути образца, включая один элемент массива", () => {
    const paths = discoverPaths({ id: "1", items: [{ title: "x" }] });

    expect(paths).toContain("/id");
    expect(paths).toContain("/items");
    expect(paths).toContain("/items/0/title");
  });
});
