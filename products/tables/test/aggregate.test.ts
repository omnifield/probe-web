// Итоги по колонке. Имена методов рыночные (OData), поведение — наше, и здесь оно записано.

import { describe, expect, it } from "vitest";

import { aggregate } from "../src/dataset/aggregate.js";
import type { ColumnSpec } from "../src/table/model.js";
import type { Row } from "../src/filters/index.js";

const AMOUNT: ColumnSpec = { name: "/amount", label: "сумма", type: "number" };
const REGION: ColumnSpec = { name: "/region", label: "регион", type: "text" };
const CREATED: ColumnSpec = { name: "/created", label: "заведена", type: "date" };

const ROWS: Row[] = [
  { amount: 100, region: "Москва", created: "2026-01-10" },
  { amount: 300, region: "Тула" },
  { amount: "", region: "Москва", created: "2026-03-01" },
  { region: "Москва" },
];

describe("счётчики", () => {
  it("`count` считает ЧЛЕНОВ НАБОРА — как `$count` у OData, одинаково для всех колонок", () => {
    expect(aggregate(ROWS, AMOUNT, "count").value).toBe(4);
    expect(aggregate(ROWS, REGION, "count").value).toBe(4);
  });

  it("`countdistinct` считает различные непустые значения", () => {
    expect(aggregate(ROWS, REGION, "countdistinct").value).toBe(2);
  });

  it("счётчики помечены отдельно — их показывают числом, а не форматом колонки", () => {
    // Иначе «различных: 2» у колонки-рейтинга уехало бы на экран двумя звёздами.
    expect(aggregate(ROWS, AMOUNT, "count").counting).toBe(true);
    expect(aggregate(ROWS, AMOUNT, "sum").counting).toBe(false);
  });
});

describe("сведение значений", () => {
  it("сумма, наименьшее, наибольшее и среднее — по непустым и разбираемым", () => {
    expect(aggregate(ROWS, AMOUNT, "sum").value).toBe(400);
    expect(aggregate(ROWS, AMOUNT, "min").value).toBe(100);
    expect(aggregate(ROWS, AMOUNT, "max").value).toBe(300);
    expect(aggregate(ROWS, AMOUNT, "average").value).toBe(200);
  });

  it("считать было нечего — итога НЕТ, и это не ноль", () => {
    // «Сумма нулевая» и «складывать было нечего» — разные вещи, и ноль соврал бы.
    expect(aggregate([{ region: "Тула" }], AMOUNT, "sum").value).toBeNull();
    expect(aggregate([], AMOUNT, "average").value).toBeNull();
  });

  it("текст, который не число, в сведение не попадает", () => {
    expect(aggregate([{ amount: "много" }, { amount: 5 }], AMOUNT, "sum").value).toBe(5);
  });

  it("даты сводятся по времени — «самая ранняя» это минимум", () => {
    const min = aggregate(ROWS, CREATED, "min").value;
    expect(min).toBe(Date.parse("2026-01-10"));
  });

  it("метод берётся у колонки, когда его не назвали", () => {
    expect(aggregate(ROWS, { ...AMOUNT, aggregate: "sum" }).value).toBe(400);
    expect(aggregate(ROWS, AMOUNT).kind).toBe("count");
  });
});
