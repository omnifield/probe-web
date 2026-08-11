// Вторая волна вида: закрепление колонок, ширины, группировка, размер страницы.

import { describe, expect, it } from "vitest";

import type { ColumnDictionary, ViewState } from "../src/table/model.js";
import { EMPTY_VIEW, groupableBy } from "../src/table/model.js";
import {
  COLUMN_WIDTH_STEP,
  groupableColumns,
  MIN_COLUMN_WIDTH,
  pinColumn,
  pinnedEdgeOf,
  setColumnWidth,
  setPageSize,
  toggleGrouping,
  visibleColumns,
} from "../src/table/view.js";

const COLUMNS: ColumnDictionary = [
  { name: "/applicant", label: "заявитель", type: "text" },
  { name: "/amount", label: "сумма", type: "number" },
  { name: "/created", label: "заведена", type: "date" },
  { name: "/urgent", label: "срочная", type: "bool" },
];

const names = (columns: { name: string }[]) => columns.map((column) => column.name);

describe("закрепление колонок", () => {
  it("прижатая колонка уходит к своему краю, а не остаётся на месте", () => {
    const view = pinColumn(EMPTY_VIEW, "/created", "start");
    expect(pinnedEdgeOf(view, "/created")).toBe("start");
    expect(names(visibleColumns(COLUMNS, view))).toEqual([
      "/created",
      "/applicant",
      "/amount",
      "/urgent",
    ]);
  });

  it("прижатие к другому краю снимает с прежнего — двух краёв сразу не бывает", () => {
    const start = pinColumn(EMPTY_VIEW, "/amount", "start");
    const end = pinColumn(start, "/amount", "end");

    expect(end.pinned).toEqual({ start: [], end: ["/amount"] });
    expect(names(visibleColumns(COLUMNS, end))).toEqual([
      "/applicant",
      "/created",
      "/urgent",
      "/amount",
    ]);
  });

  it("отпускание возвращает колонку в общий порядок", () => {
    const pinned = pinColumn(EMPTY_VIEW, "/urgent", "start");
    const free = pinColumn(pinned, "/urgent", null);

    expect(pinnedEdgeOf(free, "/urgent")).toBeNull();
    expect(names(visibleColumns(COLUMNS, free))).toEqual(names([...COLUMNS]));
  });

  it("скрытая колонка не всплывает из-за того, что она закреплена", () => {
    const view: ViewState = { ...pinColumn(EMPTY_VIEW, "/amount", "start"), hidden: ["/amount"] };
    expect(names(visibleColumns(COLUMNS, view))).toEqual(["/applicant", "/created", "/urgent"]);
  });
});

describe("ширины", () => {
  it("ширина запоминается и сбрасывается", () => {
    const wide = setColumnWidth(EMPTY_VIEW, "/amount", 200);
    expect(wide.widths).toEqual({ "/amount": 200 });

    const reset = setColumnWidth(wide, "/amount", null);
    expect(reset.widths).toEqual({});
  });

  it("ширина не опускается ниже читаемой", () => {
    // Колонка уже этого — заголовок нечитаем, и вернуть её мышью почти невозможно.
    const narrow = setColumnWidth(EMPTY_VIEW, "/amount", 5);
    expect(narrow.widths["/amount"]).toBe(MIN_COLUMN_WIDTH);
  });

  it("шаг с клавиатуры объявлен числом, а не спрятан в разметке", () => {
    expect(COLUMN_WIDTH_STEP).toBeGreaterThan(0);
  });
});

describe("группировка", () => {
  it("уровни складываются в порядке нажатий — это и есть вложенность", () => {
    const first = toggleGrouping(EMPTY_VIEW, "/urgent");
    const second = toggleGrouping(first, "/applicant");
    expect(second.grouping).toEqual(["/urgent", "/applicant"]);

    const back = toggleGrouping(second, "/urgent");
    expect(back.grouping).toEqual(["/applicant"]);
  });

  it("по умолчанию группируются текст и да/нет, а число и дата — нет", () => {
    // Группировка по сумме даёт столько же групп, сколько строк: это не группировка,
    // а тот же список с отступами.
    expect(names(groupableColumns(COLUMNS))).toEqual(["/applicant", "/urgent"]);
    expect(groupableBy({ name: "/amount", label: "сумма", type: "number", groupable: true })).toBe(true);
  });
});

describe("размер страницы", () => {
  it("задаётся и снимается", () => {
    expect(setPageSize(EMPTY_VIEW, 25).pageSize).toBe(25);
    expect(setPageSize(EMPTY_VIEW, null).pageSize).toBeNull();
  });

  it("меньше одной строки на странице не бывает", () => {
    expect(setPageSize(EMPTY_VIEW, 0).pageSize).toBe(1);
  });
});
