// Прочтение фильтра словами — это проверка того, что интерфейс не врёт о собранном отборе.
// Поэтому фраза сверяется целиком, а не «содержит подстроку».

import { describe, expect, it } from "vitest";

import { describeCondition, describeFilter, labelsOf } from "../src/filters/describe.js";
import type { FieldDictionary, FilterState } from "../src/filters/model.js";

const FIELDS: FieldDictionary = [
  { name: "/applicant", label: "заявитель", type: "text" },
  { name: "/amount", label: "сумма", type: "number" },
  { name: "/region", label: "регион", type: "text" },
  { name: "/passport", label: "паспорт", type: "text" },
];

const LABELS = labelsOf(FIELDS);

describe("одно условие словами", () => {
  it("сравнение", () => {
    expect(
      describeCondition(
        { id: "c1", kind: "compare", field: "/applicant", operator: "contains", value: " Ив " },
        LABELS,
      ),
    ).toBe("«заявитель» содержит «Ив»");
  });

  it("учёт регистра проговаривается — иначе разное поведение выглядит одинаково", () => {
    expect(
      describeCondition(
        { id: "c1", kind: "compare", field: "/applicant", operator: "eq", value: "Иванов", sensitive: true },
        LABELS,
      ),
    ).toBe("«заявитель» равно «Иванов», с учётом регистра");
  });

  it("одно из списка", () => {
    expect(
      describeCondition({ id: "c1", kind: "in", field: "/region", values: ["Москва", "Тула"] }, LABELS),
    ).toBe("«регион» — одно из: «Москва», «Тула»");
  });

  it("диапазон — с прямым указанием, что границы включены", () => {
    expect(
      describeCondition({ id: "c1", kind: "between", field: "/amount", from: "100", to: "200" }, LABELS),
    ).toBe("«сумма» от «100» до «200» включительно");
  });

  it("наличие полей", () => {
    expect(
      describeCondition(
        { id: "c1", kind: "presence", quantifier: "any", mode: "exists", fields: ["/passport", "/inn"] },
        LABELS,
      ),
    ).toBe("есть любое из: «паспорт», «/inn»");
  });

  it("недозаполненное условие так и называется, а не притворяется рабочим", () => {
    expect(describeCondition({ id: "c1", kind: "in", field: "/region", values: [] }, LABELS)).toBe(
      "«регион»: список значений пуст",
    );
    expect(
      describeCondition({ id: "c1", kind: "between", field: "/amount", from: "", to: "200" }, LABELS),
    ).toBe("«сумма»: границы диапазона не заданы");
    expect(
      describeCondition(
        { id: "c1", kind: "presence", quantifier: "all", mode: "filled", fields: [] },
        LABELS,
      ),
    ).toBe("заполнено: поля не выбраны");
  });

  it("поле без подписи показывается своим путём, а не пропадает", () => {
    expect(
      describeCondition({ id: "c1", kind: "compare", field: "/contact/phone", operator: "eq", value: "1" }),
    ).toBe("«/contact/phone» равно «1»");
  });
});

describe("весь фильтр фразой", () => {
  const conditions: FilterState["conditions"] = [
    { id: "c1", kind: "compare", field: "/applicant", operator: "contains", value: "Ив" },
    { id: "c2", kind: "in", field: "/region", values: ["Москва"] },
    { id: "c3", kind: "compare", field: "/amount", operator: "gt", value: "100" },
  ];

  it("без условий", () => {
    expect(describeFilter({ version: 1, conditions: [], logic: { mode: "all" } }, LABELS)).toBe(
      "Показаны все строки — условий нет.",
    );
  });

  it("все через И", () => {
    expect(describeFilter({ version: 1, conditions, logic: { mode: "all" } }, LABELS)).toBe(
      "Показать строки, где «заявитель» содержит «Ив» и «регион» — одно из: «Москва» и «сумма» больше «100».",
    );
  });

  it("скобки в фразе ставятся там, где приоритет их требует", () => {
    const state: FilterState = {
      version: 1,
      conditions,
      logic: {
        mode: "formula",
        expr: {
          t: "and",
          a: { t: "ref", id: "c1" },
          b: { t: "or", a: { t: "ref", id: "c2" }, b: { t: "ref", id: "c3" } },
        },
      },
    };

    expect(describeFilter(state, LABELS)).toBe(
      "Показать строки, где «заявитель» содержит «Ив» и («регион» — одно из: «Москва» или «сумма» больше «100»).",
    );
  });

  it("ссылка на удалённое условие произносится вслух", () => {
    const state: FilterState = {
      version: 1,
      conditions: [conditions[0]!],
      logic: { mode: "formula", expr: { t: "and", a: { t: "ref", id: "c1" }, b: { t: "ref", id: "c9" } } },
    };

    expect(describeFilter(state, LABELS)).toBe(
      "Показать строки, где «заявитель» содержит «Ив» и условие, которого больше нет.",
    );
  });

  it("отрицание читается отрицанием", () => {
    const state: FilterState = {
      version: 1,
      conditions: [conditions[0]!],
      logic: { mode: "formula", expr: { t: "not", a: { t: "ref", id: "c1" } } },
    };

    expect(describeFilter(state, LABELS)).toBe(
      "Показать строки, где не («заявитель» содержит «Ив»).",
    );
  });
});
