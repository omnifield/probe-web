// График в документе: роли доступности, подписи величин, выделение как запрос к данным.

import { afterEach, describe, expect, it, vi } from "vitest";

import { Chart, ChartLegend } from "../src/chart/chart.jsx";
import { type ChartSpec, MISSING_KEY, OTHER_KEY } from "../src/chart/model.js";
import { selectionCondition, seriesCondition } from "../src/chart/select.js";
import type { ColumnDictionary } from "../src/table/index.js";
import type { Row } from "../src/filters/index.js";
import { all, cleanup, mount, one, press } from "./dom.jsx";

afterEach(cleanup);

const COLUMNS: ColumnDictionary = [
  { name: "/region", label: "регион", type: "text" },
  { name: "/status", label: "статус", type: "text" },
  { name: "/amount", label: "сумма", type: "number", formatOptions: { fractionDigits: 0 } },
];

const ROWS: Row[] = [
  { region: "Москва", status: "новая", amount: 100 },
  { region: "Москва", status: "в работе", amount: 300 },
  { region: "Тула", status: "новая", amount: 50 },
  { region: "Казань", status: "в работе", amount: 700 },
];

const SPEC: ChartSpec = {
  version: 1,
  mark: "bar",
  slice: "/region",
  measure: { field: "/amount", aggregate: "sum" },
};

function setup(spec: ChartSpec = SPEC, extra: Partial<Parameters<typeof Chart>[0]> = {}) {
  return mount(() => <Chart columns={COLUMNS} rows={ROWS} spec={spec} {...extra} />);
}

describe("доступность", () => {
  it("график — `graphics-document` с подписью и кратким описанием", () => {
    // Роли нормированы отдельным модулем W3C именно для того, чтобы график можно было
    // ПРОЙТИ, а не увидеть непрозрачной картинкой.
    const host = setup(SPEC, { title: "Сумма по регионам" });
    const svg = one(host, "[data-slot='chart']");

    expect(svg.getAttribute("role")).toBe("graphics-document");
    expect(svg.getAttribute("aria-label")).toBe("Сумма по регионам");
    expect(one(host, "[data-slot='chart-summary']").textContent).toContain("столбики");
  });

  it("серия — `graphics-object`, величина — `graphics-symbol` со сказанным значением", () => {
    const host = setup();

    expect(one(host, "[data-slot='chart-series']").getAttribute("role")).toBe("graphics-object");

    const marks = all(host, "[data-slot='chart-mark']");
    expect(marks).toHaveLength(3);
    expect(marks[0]?.getAttribute("role")).toBe("graphics-symbol");
    expect(marks[0]?.getAttribute("aria-label")?.replace(/\s/g, " ")).toBe("Москва: 400");
  });

  it("оси спрятаны от вспомогательной технологии — их числа уже сказаны в величинах", () => {
    const host = setup();
    expect(one(host, "[data-slot='chart-value-axis']").getAttribute("aria-hidden")).toBe("true");
    expect(one(host, "[data-slot='chart-slice-axis']").getAttribute("aria-hidden")).toBe("true");
  });

  it("серия названа в подписи величины, когда серий несколько", () => {
    const host = setup({ ...SPEC, series: "/status" });
    const label = one(host, "[data-slot='chart-mark']").getAttribute("aria-label") ?? "";
    expect(label).toContain("серия «новая»");
  });
});

describe("геометрия", () => {
  it("столбик от нуля: величина втрое больше — и столбик втрое длиннее", () => {
    const host = setup();
    const marks = all<SVGRectElement>(host, "[data-slot='chart-mark']");
    const height = (index: number) => Number(marks[index]!.getAttribute("height"));

    // Москва 400, Тула 50, Казань 700 — отношения длин обязаны совпасть с отношениями величин.
    expect(height(0) / height(1)).toBeCloseTo(8, 1);
    expect(height(2) / height(0)).toBeCloseTo(1.75, 1);
  });

  it("столбики серий стоят РЯДОМ, а не друг на друге", () => {
    const host = setup({ ...SPEC, series: "/status" });
    const first = all<SVGRectElement>(host, "[data-slot='chart-series'][data-series='0'] [data-slot='chart-mark']");
    const second = all<SVGRectElement>(host, "[data-slot='chart-series'][data-series='1'] [data-slot='chart-mark']");

    expect(Number(first[0]!.getAttribute("x"))).toBeLessThan(Number(second[0]!.getAttribute("x")));
  });

  it("линия рисуется одним путём и пропускает пустые точки", () => {
    const host = setup({ ...SPEC, mark: "line", series: "/status" });
    const path = one(host, "[data-slot='chart-line']");

    expect(path.getAttribute("d")).toMatch(/^M/);
    expect(path.getAttribute("fill")).toBe("none");
  });

  it("точка вместо столбика, когда марка того просит", () => {
    const host = setup({ ...SPEC, mark: "point" });
    expect(all(host, "circle[data-slot='chart-mark']")).toHaveLength(3);
  });

  it("считать нечего — так и написано", () => {
    const host = mount(() => <Chart columns={COLUMNS} rows={[]} spec={SPEC} />);
    expect(one(host, "[data-slot='chart-empty']").textContent).toBe("Считать нечего");
  });
});

describe("ничего своего не раскрашивает", () => {
  it("цвет берётся у потребителя через `currentColor`", () => {
    // Кит безголовый: привези график свою палитру — половина базы стала бы оформленной.
    const host = setup();
    expect(one(host, "[data-slot='chart-mark']").getAttribute("fill")).toBe("currentColor");
    expect(one(host, "[data-slot='chart']").hasAttribute("class")).toBe(false);
  });
});

describe("выделение — запрос к данным", () => {
  it("без обработчика величины не попадают в обход клавиатурой", () => {
    const host = setup();
    expect(one(host, "[data-slot='chart-mark']").hasAttribute("tabindex")).toBe(false);
  });

  it("клик отдаёт категорию", () => {
    const onSelect = vi.fn();
    const host = setup(SPEC, { onSelect });

    press(all(host, "[data-slot='chart-mark']")[1]!);

    expect(onSelect).toHaveBeenCalledWith({ key: "Тула", label: "Тула" });
  });

  it("Enter делает то же, что клик", () => {
    const onSelect = vi.fn();
    const host = setup(SPEC, { onSelect });

    const mark = all(host, "[data-slot='chart-mark']")[0]!;
    expect(mark.getAttribute("tabindex")).toBe("0");
    mark.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("выделение видно и глазом, и вспомогательной технологии", () => {
    const host = setup(SPEC, { onSelect: () => {}, selected: ["Москва"] });
    const mark = all(host, "[data-slot='chart-mark']")[0]!;

    expect(mark.hasAttribute("data-selected")).toBe(true);
    expect(mark.getAttribute("aria-label")).toContain("выделено");
  });

  it("клик по серии отдаёт и её", () => {
    const onSelect = vi.fn();
    const host = setup({ ...SPEC, series: "/status" }, { onSelect });

    press(all(host, "[data-slot='chart-mark']")[0]!);

    expect(onSelect.mock.calls[0]![0]).toMatchObject({ key: "Москва", seriesKey: "новая" });
  });
});

describe("выделение переводится в УСЛОВИЕ ОТБОРА", () => {
  it("категория становится условием «поле равно значению»", () => {
    // Ровно то, ради чего выделение считается запросом к данным: отдельной ветки логики
    // «клик на графике» не существует, есть общий язык отбора.
    const condition = selectionCondition(SPEC, { key: "Москва", label: "Москва" });

    expect(condition).toMatchObject({
      kind: "compare",
      field: "/region",
      operator: "eq",
      value: "Москва",
      sensitive: true,
    });
  });

  it("«прочее» и «нет значения» условием НЕ становятся", () => {
    expect(selectionCondition(SPEC, { key: OTHER_KEY, label: "прочее" })).toBeNull();
    expect(selectionCondition(SPEC, { key: MISSING_KEY, label: "нет значения" })).toBeNull();
  });

  it("серия даёт ВТОРОЕ условие, а не склеивается с первым", () => {
    const spec = { ...SPEC, series: "/status" };
    const selection = { key: "Москва", label: "Москва", seriesKey: "новая", seriesLabel: "новая" };

    expect(seriesCondition(spec, selection)).toMatchObject({ field: "/status", value: "новая" });
    expect(seriesCondition(SPEC, selection)).toBeNull();
  });
});

describe("легенда", () => {
  it("появляется только когда серий больше одной", () => {
    const withSeries = mount(() => (
      <ChartLegend columns={COLUMNS} rows={ROWS} spec={{ ...SPEC, series: "/status" }} />
    ));
    expect(all(withSeries, "[data-slot='chart-legend-item']")).toHaveLength(2);

    const without = mount(() => <ChartLegend columns={COLUMNS} rows={ROWS} spec={SPEC} />);
    expect(without.querySelector("[data-slot='chart-legend']")).toBeNull();
  });
});
