// Данные → точки графика. Главное здесь: сведение делается ДО отрисовки, и считает его та же
// середина, что считает итоги в таблице.

import { describe, expect, it } from "vitest";

import { buildChart } from "../src/chart/transform.js";
import { type ChartSpec, MISSING_KEY, OTHER_KEY } from "../src/chart/model.js";
import type { ColumnDictionary } from "../src/table/index.js";
import type { Row } from "../src/filters/index.js";

const COLUMNS: ColumnDictionary = [
  { name: "/region", label: "регион", type: "text" },
  { name: "/status", label: "статус", type: "text" },
  { name: "/amount", label: "сумма", type: "number" },
];

const ROWS: Row[] = [
  { region: "Москва", status: "новая", amount: 100 },
  { region: "Москва", status: "в работе", amount: 300 },
  { region: "Тула", status: "новая", amount: 50 },
  { region: "Казань", status: "в работе", amount: 700 },
  { region: "Казань", status: "новая", amount: 200 },
  { status: "новая", amount: 5 },
];

const spec = (over: Partial<ChartSpec> = {}): ChartSpec => ({
  version: 1,
  mark: "bar",
  slice: "/region",
  measure: { field: "/amount", aggregate: "sum" },
  ...over,
});

const points = (data: ReturnType<typeof buildChart>, seriesIndex = 0) =>
  data.series[seriesIndex]!.points.map((point) => [point.label, point.value] as const);

describe("сведение по срезу", () => {
  it("одна запись на группу — сумма считается ДО отрисовки", () => {
    const data = buildChart(ROWS, spec(), COLUMNS);
    expect(points(data)).toEqual([
      ["Москва", 400],
      ["Тула", 50],
      ["Казань", 900],
      ["нет значения", 5],
    ]);
  });

  it("счёт членов группы не смотрит на поле меры", () => {
    const data = buildChart(ROWS, spec({ measure: { aggregate: "count" } }), COLUMNS);
    expect(points(data)).toEqual([
      ["Москва", 2],
      ["Тула", 1],
      ["Казань", 2],
      ["нет значения", 1],
    ]);
  });

  it("строки без значения среза становятся ВИДИМОЙ категорией, а не пропадают", () => {
    // Молча выбросить строки — соврать про набор: на графике «всего» стало бы меньше, чем в
    // таблице, и объяснить это было бы нечем.
    const data = buildChart(ROWS, spec(), COLUMNS);
    expect(data.missing).toBe(1);
    expect(data.categories.map((category) => category.key)).toContain(MISSING_KEY);
  });

  it("пустой набор — считать нечего, и это сказано отдельно", () => {
    const data = buildChart([], spec(), COLUMNS);
    expect(data.empty).toBe(true);
    expect(data.categories).toEqual([]);
  });
});

describe("серии", () => {
  it("разбивка даёт по серии на значение поля, и точки выровнены по общим категориям", () => {
    const data = buildChart(ROWS, spec({ series: "/status" }), COLUMNS);

    expect(data.series.map((series) => series.label)).toEqual(["новая", "в работе"]);
    expect(data.series.every((series) => series.points.length === data.categories.length)).toBe(true);
  });

  it("в серии, где категории нет, точка ПУСТА, а не нулевая", () => {
    // Ноль означал бы «посчитали и вышло ноль»; здесь считать было нечего.
    const data = buildChart(ROWS, spec({ series: "/status" }), COLUMNS);
    const inProgress = data.series.find((series) => series.label === "в работе")!;
    const tula = inProgress.points.find((point) => point.label === "Тула")!;

    expect(tula.value).toBeNull();
    expect(tula.count).toBe(0);
  });
});

describe("порядок и обрезка", () => {
  it("по убыванию значения", () => {
    const data = buildChart(ROWS, spec({ order: "value-desc" }), COLUMNS);
    expect(data.categories.map((category) => category.label)).toEqual([
      "Казань",
      "Москва",
      "Тула",
      "нет значения",
    ]);
  });

  it("по названию", () => {
    const data = buildChart(ROWS, spec({ order: "label" }), COLUMNS);
    expect(data.categories[0]!.label).toBe("Казань");
  });

  it("хвост за пределом сводится в «прочее» и считается вместе", () => {
    const data = buildChart(ROWS, spec({ order: "value-desc", limit: 2 }), COLUMNS);

    expect(data.categories.map((category) => category.key)).toEqual(["Казань", "Москва", OTHER_KEY]);
    expect(points(data)).toEqual([
      ["Казань", 900],
      ["Москва", 400],
      ["прочее", 55],
    ]);
  });

  it("«прочее» из одной категории не собирается — оно соврало бы про её имя", () => {
    const data = buildChart(ROWS, spec({ order: "value-desc", limit: 3 }), COLUMNS);
    expect(data.categories.map((category) => category.key)).not.toContain(OTHER_KEY);
  });
});

describe("домен значений", () => {
  it("столбики меряются ОТ НУЛЯ", () => {
    // Обрезанная ось делает разницу в проценты похожей на разницу в разы: длина столбика
    // читается как величина, и её нельзя начинать с произвольного места.
    const data = buildChart(ROWS, spec(), COLUMNS);
    expect(data.min).toBe(0);
    expect(data.max).toBe(900);
  });

  it("линия живёт в домене данных — там читается ход, а не длина", () => {
    const data = buildChart(ROWS, spec({ mark: "line" }), COLUMNS);
    expect(data.min).toBe(5);
    expect(data.max).toBe(900);
  });
});
