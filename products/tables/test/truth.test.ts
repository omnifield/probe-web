// Таблицы истинности сверяются ЯЧЕЙКА В ЯЧЕЙКУ с первоисточником, а не «в общем правильно».
//
// Источник — OGC CQL2 (21-065r2): Table 2 (§6.2, AND/OR, 9 строк) и Table 3 (§6.6, NOT,
// 3 строки); та же норма на открытом тексте PostgreSQL. Обе выписки лежат в фонде
// `canons/filter-tables-graphs` и прошли ручную сверку с отрисовкой источника 2026-08-10.
//
// Почему списком строк, а не набором отдельных `it`: таблица проверяется как таблица —
// пропущенная строка тогда видна, а разрозненные проверки скрывают дыру.

import { describe, expect, it } from "vitest";

import { and, not, or, passes, type Truth, UNKNOWN } from "../src/filters/truth.js";

const T = true;
const F = false;
const N: Truth = UNKNOWN;

describe("трёхзначная логика — CQL2 Table 2 (AND/OR)", () => {
  const rows: Array<[Truth, Truth, Truth, Truth]> = [
    // [Predicate1, Predicate2, P1 AND P2, P1 OR P2] — порядок колонок как в стандарте.
    [T, T, T, T],
    [T, F, F, T],
    [F, T, F, T],
    [F, F, F, F],
    [T, N, N, T],
    [F, N, F, N],
    [N, T, N, T],
    [N, F, F, N],
    [N, N, N, N],
  ];

  it.each(rows)("%s · %s → И: %s, ИЛИ: %s", (a, b, expectedAnd, expectedOr) => {
    expect(and(a, b)).toBe(expectedAnd);
    expect(or(a, b)).toBe(expectedOr);
  });

  it("покрыты все девять строк таблицы", () => {
    expect(rows).toHaveLength(9);
  });

  it("ложь ПОГЛОЩАЕТ неизвестное в И, истина — в ИЛИ", () => {
    // Ровно те две ячейки, которые ломает наивное «есть неизвестное → результат неизвестен».
    expect(and(F, N)).toBe(F);
    expect(or(T, N)).toBe(T);
  });
});

describe("трёхзначная логика — CQL2 Table 3 (NOT)", () => {
  it.each([
    [T, F],
    [F, T],
    [N, N],
  ])("НЕ %s → %s", (value, expected) => {
    expect(not(value)).toBe(expected);
  });

  it("отрицание неизвестного остаётся неизвестным, а не становится истиной", () => {
    // Это и было нашим расхождением до 2026-08-11: `!false === true` пропускал строки,
    // у которых поля нет вовсе.
    expect(not(UNKNOWN)).toBe(UNKNOWN);
    expect(not(UNKNOWN)).not.toBe(true);
  });
});

describe("отбор", () => {
  it("пропускает только истину", () => {
    expect(passes(T)).toBe(true);
    expect(passes(F)).toBe(false);
    expect(passes(N)).toBe(false);
  });
});
