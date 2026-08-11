// Показ значения. Формат — визуал, поэтому проверяется и текст, и машинные зацепки.

import { describe, expect, it } from "vitest";

import { formatValue } from "../src/dataset/format.js";
import type { ColumnSpec } from "../src/table/model.js";
import { defaultFormat, formatOf } from "../src/dataset/spec.js";

const column = (over: Partial<ColumnSpec> = {}): ColumnSpec => ({
  name: "/value",
  label: "значение",
  type: "text",
  ...over,
});

/** Пробелы в русских числах — неразрывные и узкие; сверять по коду точки надёжнее. */
const plain = (text: string) => text.replace(/ | /g, " ");

describe("формат по умолчанию", () => {
  it("выводится из типа поля", () => {
    expect(defaultFormat("number")).toBe("number");
    expect(defaultFormat("date")).toBe("date");
    expect(defaultFormat("bool")).toBe("bool");
    expect(defaultFormat("text")).toBe("text");
  });

  it("объявленный формат сильнее выведенного — одно число бывает и суммой, и рейтингом", () => {
    expect(formatOf(column({ type: "number" }))).toBe("number");
    expect(formatOf(column({ type: "number", format: "rating" }))).toBe("rating");
  });
});

describe("числа и проценты", () => {
  it("число показывается по языку показа", () => {
    expect(plain(formatValue(1234567.891, column({ type: "number" })).text)).toBe("1 234 567,89");
  });

  it("знаки после запятой задаются колонкой", () => {
    expect(formatValue(3.14159, column({ type: "number", formatOptions: { fractionDigits: 3 } })).text).toBe(
      "3,142",
    );
  });

  it("процент по умолчанию считает значение ДОЛЕЙ", () => {
    expect(plain(formatValue(0.42, column({ type: "number", format: "percent" })).text)).toBe("42 %");
  });

  it("сотые объявляются явно, а не угадываются", () => {
    // Молчаливое умножение на сто — самая дешёвая ошибка и самая заметная на экране.
    const spec = column({ type: "number", format: "percent", formatOptions: { percentBase: "hundred" } });
    expect(plain(formatValue(42, spec).text)).toBe("42 %");
  });
});

describe("даты", () => {
  it("ISO показывается по-человечески", () => {
    expect(formatValue("2026-08-11", column({ type: "date" })).text).toBe("11.08.2026");
  });

  it("понимает и дд.мм.гггг — ту же запись, что и фильтр", () => {
    expect(formatValue("11.08.2026", column({ type: "date" })).text).toBe("11.08.2026");
  });

  it("рядом с человеческой формой едет машинная", () => {
    expect(formatValue("2026-08-11", column({ type: "date" })).attrs["data-value"]).toBe(
      "2026-08-11T00:00:00.000Z",
    );
  });

  it("дата со временем показывает и время", () => {
    const text = formatValue("2026-08-11T14:30:00Z", column({ type: "date", format: "datetime" })).text;
    expect(text).toContain("11.08.2026");
    expect(text).toContain("14:30");
  });
});

describe("да/нет и рейтинг", () => {
  it("логическое значение читается словом", () => {
    expect(formatValue(true, column({ type: "bool" })).text).toBe("да");
    expect(formatValue(false, column({ type: "bool" })).text).toBe("нет");
    expect(formatValue("да", column({ type: "bool" })).text).toBe("да");
  });

  it("рейтинг отдаёт число и зацепки, а звёзды рисует потребитель", () => {
    // Привези мы звёзды сами — половина кита была бы безголовой, половина оформленной.
    const shown = formatValue(4.5, column({ type: "number", format: "rating" }));
    expect(shown.text).toBe("4,5");
    expect(shown.attrs).toEqual({ "data-value": "4.5", "data-rating": "4.5", "data-rating-max": "5" });
  });

  it("верх шкалы задаётся колонкой", () => {
    const spec = column({ type: "number", format: "rating", formatOptions: { ratingMax: 10 } });
    expect(formatValue(7, spec).attrs["data-rating-max"]).toBe("10");
  });
});

describe("что показывается, когда показать нечего", () => {
  it("пустое значение — пустой текст без зацепок", () => {
    expect(formatValue(null, column({ type: "number" }))).toEqual({ text: "", attrs: {} });
    expect(formatValue(undefined, column({ type: "date" }))).toEqual({ text: "", attrs: {} });
  });

  it("значение, не разбираемое по формату, показывается КАК ЕСТЬ и помечается", () => {
    // Соврать форматом («—», ноль, пустая ячейка) дешевле всего и хуже всего: на экране это
    // выглядит как настоящие данные.
    expect(formatValue("вчера", column({ type: "date" }))).toEqual({
      text: "вчера",
      attrs: { "data-unformatted": "" },
    });
    expect(formatValue("много", column({ type: "number" })).attrs).toEqual({ "data-unformatted": "" });
    expect(formatValue("может быть", column({ type: "bool" })).text).toBe("может быть");
  });
});
