// Вычисление фильтра. Главная проверка файла — что «поля нет» это НЕИЗВЕСТНО, а не ложь, и
// что отрицание неизвестного не пропускает строку.

import { describe, expect, it } from "vitest";

import { applyFilter, compile, countMatching, matchCondition } from "../src/filters/evaluate.js";
import type {
  ComparisonCondition,
  Condition,
  FieldDictionary,
  FilterState,
  MemberCondition,
  PresenceCondition,
  RangeCondition,
} from "../src/filters/model.js";
import { FILTER_FORMAT_VERSION } from "../src/filters/model.js";
import type { Row } from "../src/filters/field.js";
import { UNKNOWN } from "../src/filters/truth.js";

const FIELDS: FieldDictionary = [
  { name: "/applicant", label: "заявитель", type: "text" },
  { name: "/amount", label: "сумма", type: "number" },
  { name: "/created", label: "заведена", type: "date" },
  { name: "/urgent", label: "срочная", type: "bool" },
  { name: "/contact/phone", label: "телефон", type: "text" },
];

const options = { fields: FIELDS };

function compare(over: Partial<ComparisonCondition> = {}): ComparisonCondition {
  return { id: "c1", kind: "compare", field: "/applicant", operator: "eq", value: "Иванов", ...over };
}

function state(conditions: Condition[], logic: FilterState["logic"] = { mode: "all" }): FilterState {
  return { version: FILTER_FORMAT_VERSION, conditions, logic };
}

describe("сравнение и неизвестное", () => {
  it("поля НЕТ — ответ неизвестно, а не ложь", () => {
    expect(matchCondition({}, compare(), options)).toBe(UNKNOWN);
  });

  it("значение `null` — тоже неизвестно: сравнивать не с чем", () => {
    expect(matchCondition({ applicant: null }, compare(), options)).toBe(UNKNOWN);
  });

  it("«не равно» на отсутствующем поле НЕ становится истиной", () => {
    // Двузначная модель ответила бы здесь `true` и притащила бы строки, которых в SQL нет.
    expect(matchCondition({}, compare({ operator: "ne" }), options)).toBe(UNKNOWN);
  });

  it("отрицание условия над строкой без поля НЕ пропускает строку", () => {
    // Тот самый случай из разбора: `НЕ 1` над строкой, где поля нет вовсе.
    const rows: Row[] = [{ applicant: "Иванов" }, { applicant: "Петров" }, {}];
    const result = applyFilter(
      rows,
      state([compare()], { mode: "formula", expr: { t: "not", a: { t: "ref", id: "c1" } } }),
      options,
    );

    expect(result.error).toBeNull();
    expect(result.rows).toEqual([{ applicant: "Петров" }]);
  });

  it("равенство по умолчанию без учёта регистра, с флагом — с учётом", () => {
    expect(matchCondition({ applicant: "иванов" }, compare(), options)).toBe(true);
    expect(matchCondition({ applicant: "иванов" }, compare({ sensitive: true }), options)).toBe(false);
  });

  it("подстрока", () => {
    const condition = compare({ operator: "contains", value: "ван" });
    expect(matchCondition({ applicant: "Иванов" }, condition, options)).toBe(true);
    expect(matchCondition({ applicant: "Петров" }, condition, options)).toBe(false);
  });

  it("вложенное поле сравнивается по пути", () => {
    const condition = compare({ field: "/contact/phone", operator: "contains", value: "900" });
    expect(matchCondition({ contact: { phone: "+7 900 111" } }, condition, options)).toBe(true);
    expect(matchCondition({ contact: {} }, condition, options)).toBe(UNKNOWN);
    expect(matchCondition({ phone: "+7 900 111" }, condition, options)).toBe(UNKNOWN);
  });
});

describe("сравнение по типу поля", () => {
  it("числа сравниваются числами, а не текстом", () => {
    const condition = compare({ field: "/amount", operator: "gt", value: "9" });
    expect(matchCondition({ amount: 10 }, condition, options)).toBe(true);
    // Текстовое сравнение дало бы здесь ложь: «10» < «9» лексикографически.
    expect(matchCondition({ amount: "10" }, condition, options)).toBe(true);
  });

  it("границы `больше или равно` и `меньше или равно` включают саму границу", () => {
    expect(matchCondition({ amount: 100 }, compare({ field: "/amount", operator: "ge", value: "100" }), options)).toBe(true);
    expect(matchCondition({ amount: 100 }, compare({ field: "/amount", operator: "gt", value: "100" }), options)).toBe(false);
    expect(matchCondition({ amount: 100 }, compare({ field: "/amount", operator: "le", value: "100" }), options)).toBe(true);
    expect(matchCondition({ amount: 100 }, compare({ field: "/amount", operator: "lt", value: "100" }), options)).toBe(false);
  });

  it("значение, не разбираемое по типу поля, даёт неизвестно", () => {
    const condition = compare({ field: "/amount", operator: "gt", value: "много" });
    expect(matchCondition({ amount: 10 }, condition, options)).toBe(UNKNOWN);
    expect(matchCondition({ amount: "нет данных" }, compare({ field: "/amount", operator: "gt", value: "1" }), options)).toBe(UNKNOWN);
  });

  it("даты сравниваются как даты — и в ISO, и в виде дд.мм.гггг", () => {
    const condition = compare({ field: "/created", operator: "lt", value: "2026-07-01" });
    expect(matchCondition({ created: "2026-06-30" }, condition, options)).toBe(true);
    expect(matchCondition({ created: "2026-07-02" }, condition, options)).toBe(false);
    expect(matchCondition({ created: "30.06.2026" }, condition, options)).toBe(true);
  });

  it("булево понимает и слова, и логическое значение", () => {
    const condition = compare({ field: "/urgent", operator: "eq", value: "да" });
    expect(matchCondition({ urgent: true }, condition, options)).toBe(true);
    expect(matchCondition({ urgent: false }, condition, options)).toBe(false);
    expect(matchCondition({ urgent: "не пойми что" }, condition, options)).toBe(UNKNOWN);
  });

  it("без словаря полей остаётся подстраховка: обе стороны числа — сравниваем числами", () => {
    const condition = compare({ field: "/amount", operator: "gt", value: "9" });
    expect(matchCondition({ amount: 10 }, condition)).toBe(true);
    expect(matchCondition({ amount: 8 }, condition)).toBe(false);
  });

  it("без словаря нечисловое значение падает в ТЕКСТОВОЕ сравнение — и это цена отсутствия типа", () => {
    // «яблоко» > «9» лексикографически, поэтому ответ ИСТИНА, а не ложь и не неизвестно.
    // Здесь и видно, зачем словарь полей: с объявленным типом тот же случай даёт неизвестно.
    const condition = compare({ field: "/amount", operator: "gt", value: "9" });
    expect(matchCondition({ amount: "яблоко" }, condition)).toBe(true);
    expect(matchCondition({ amount: "яблоко" }, condition, options)).toBe(UNKNOWN);
  });
});

describe("одно из списка (IN)", () => {
  const condition = (values: string[]): MemberCondition => ({
    id: "c1",
    kind: "in",
    field: "/applicant",
    values,
  });

  it("совпадение с любым значением списка", () => {
    expect(matchCondition({ applicant: "Петров" }, condition(["Иванов", "Петров"]), options)).toBe(true);
    expect(matchCondition({ applicant: "Сидоров" }, condition(["Иванов", "Петров"]), options)).toBe(false);
  });

  it("пустой список — условие не дозаполнено, ответ неизвестно", () => {
    // Не «ничего не подходит»: иначе недособранное условие молча обнуляло бы выборку.
    expect(matchCondition({ applicant: "Петров" }, condition([]), options)).toBe(UNKNOWN);
  });

  it("поля нет — неизвестно", () => {
    expect(matchCondition({}, condition(["Иванов"]), options)).toBe(UNKNOWN);
  });
});

describe("диапазон (BETWEEN)", () => {
  const range = (from: string, to: string, field = "/amount"): RangeCondition => ({
    id: "c1",
    kind: "between",
    field,
    from,
    to,
  });

  it("границы ВКЛЮЧИТЕЛЬНЫ — так сказано в CQL2, и спорить не о чем", () => {
    expect(matchCondition({ amount: 100 }, range("100", "200"), options)).toBe(true);
    expect(matchCondition({ amount: 200 }, range("100", "200"), options)).toBe(true);
    expect(matchCondition({ amount: 99 }, range("100", "200"), options)).toBe(false);
    expect(matchCondition({ amount: 201 }, range("100", "200"), options)).toBe(false);
  });

  it("работает на датах", () => {
    const summer = range("2026-06-01", "2026-08-31", "/created");
    expect(matchCondition({ created: "2026-07-14" }, summer, options)).toBe(true);
    expect(matchCondition({ created: "2026-05-19" }, summer, options)).toBe(false);
  });

  it("пустая граница — неизвестно, а не «всё подходит»", () => {
    expect(matchCondition({ amount: 100 }, range("", "200"), options)).toBe(UNKNOWN);
    expect(matchCondition({ amount: 100 }, range("100", " "), options)).toBe(UNKNOWN);
  });
});

describe("наличие полей", () => {
  const presence = (over: Partial<PresenceCondition> = {}): PresenceCondition => ({
    id: "c1",
    kind: "presence",
    quantifier: "any",
    mode: "exists",
    fields: ["/passport", "/snils", "/inn"],
    ...over,
  });

  const row = { passport: "4510", snils: "", inn: null };

  it("«любое из» — достаточно одного поля", () => {
    expect(matchCondition(row, presence(), options)).toBe(true);
    expect(matchCondition({}, presence(), options)).toBe(false);
  });

  it("«все из» — по присутствию поля, даже если оно пустое", () => {
    expect(matchCondition(row, presence({ quantifier: "all" }), options)).toBe(true);
  });

  it("«все из» по ЗАПОЛНЕННОСТИ — пустое поле уже не считается", () => {
    expect(matchCondition(row, presence({ quantifier: "all", mode: "filled" }), options)).toBe(false);
  });

  it("«ни одного из»", () => {
    expect(matchCondition({}, presence({ quantifier: "none" }), options)).toBe(true);
    expect(matchCondition(row, presence({ quantifier: "none" }), options)).toBe(false);
  });

  it("наличие поля никогда не бывает неизвестным — кроме случая, когда поля не выбраны", () => {
    // Это ответ про строку, а не про значение: ср. `IS NULL` в CQL2 — тоже всегда да/нет.
    expect(matchCondition({}, presence({ fields: [] }), options)).toBe(UNKNOWN);
    expect(matchCondition({ passport: null }, presence({ fields: ["/passport"] }), options)).toBe(true);
  });
});

describe("сборка и применение", () => {
  const rows: Row[] = [
    { applicant: "Иванов", amount: 100 },
    { applicant: "Петров", amount: 300 },
    { amount: 500 },
  ];

  it("без условий проходят все строки", () => {
    expect(applyFilter(rows, state([]), options).rows).toHaveLength(3);
  });

  it("несколько условий по умолчанию соединяются через И", () => {
    const result = applyFilter(
      rows,
      state([
        compare({ id: "c1", field: "/amount", operator: "ge", value: "100" }),
        compare({ id: "c2", field: "/amount", operator: "le", value: "300" }),
      ]),
      options,
    );
    expect(result.rows).toHaveLength(2);
  });

  it("формула, ссылающаяся на удалённое условие, даёт ОШИБКУ, а не тихий пропуск", () => {
    const result = applyFilter(
      rows,
      state([compare({ id: "c1" })], { mode: "formula", expr: { t: "ref", id: "c2" } }),
      options,
    );

    expect(result.error).toBe("формула ссылается на условие, которого больше нет — поправьте формулу");
    // Строки при ошибке возвращаются КАК ЕСТЬ: пустой экран соврал бы про данные.
    expect(result.rows).toHaveLength(3);
  });

  it("рядом с предикатом отдаётся трёхзначный ответ", () => {
    const compiled = compile(state([compare()]), options);
    expect(compiled.ok).toBe(true);
    if (!compiled.ok) return;

    expect(compiled.truth({ applicant: "Иванов" })).toBe(true);
    expect(compiled.truth({ applicant: "Петров" })).toBe(false);
    expect(compiled.truth({})).toBe(UNKNOWN);
    expect(compiled.predicate({})).toBe(false);
  });
});

describe("счётчик условия", () => {
  const rows: Row[] = [
    { applicant: "Иванов" },
    { applicant: "Петров" },
    {},
    { applicant: null },
  ];

  it("считает отдельно «подошло» и «неизвестно»", () => {
    // Второе число — единственное место, где трёхзначность выходит на экран: оно говорит
    // «дело в неполных данных», а не «условие не подошло».
    expect(countMatching(rows, compare(), options)).toEqual({ matched: 1, unknown: 2 });
  });

  it("считает условие САМО ПО СЕБЕ, без оглядки на остальные", () => {
    expect(countMatching(rows, compare({ operator: "ne" }), options)).toEqual({
      matched: 1,
      unknown: 2,
    });
  });
});
