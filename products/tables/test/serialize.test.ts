// Чтение чужих данных и версия формата. Проверяется не «работает ли JSON.parse», а то, что
// испорченное состояние НЕ попадает внутрь молча.

import { describe, expect, it } from "vitest";

import { nextConditionId } from "../src/filters/model.js";
import { parseFilter, serializeFilter } from "../src/filters/serialize.js";
import type { FilterState } from "../src/filters/model.js";

const GOOD: FilterState = {
  version: 1,
  conditions: [
    { id: "c1", kind: "compare", field: "/applicant", operator: "contains", value: "Ив" },
    { id: "c2", kind: "in", field: "/region", values: ["Москва", "Тула"] },
    { id: "c3", kind: "between", field: "/amount", from: "100", to: "200" },
    { id: "c4", kind: "presence", quantifier: "any", mode: "exists", fields: ["/passport"] },
  ],
  logic: {
    mode: "formula",
    expr: {
      t: "and",
      a: { t: "or", a: { t: "ref", id: "c1" }, b: { t: "ref", id: "c2" } },
      b: { t: "not", a: { t: "ref", id: "c4" } },
    },
  },
};

function parse(input: unknown) {
  return parseFilter(JSON.parse(JSON.stringify(input)));
}

describe("круг чтения и записи", () => {
  it("состояние переживает выдачу и разбор без потерь", () => {
    const parsed = parse(serializeFilter(GOOD));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.state).toEqual(GOOD);
  });

  it("выдача — копия, а не ссылка на живое состояние", () => {
    const copy = serializeFilter(GOOD);
    copy.conditions.length = 0;
    expect(GOOD.conditions).toHaveLength(4);
  });
});

describe("версия формата", () => {
  it("без версии не читаем — прочитать нечем", () => {
    const parsed = parse({ conditions: [], logic: { mode: "all" } });
    expect(parsed).toEqual({ ok: false, error: "у фильтра нет версии формата — прочитать его нечем" });
  });

  it("чужая версия названа числом, а не «ошибкой разбора»", () => {
    const parsed = parse({ ...GOOD, version: 7 });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error).toBe("версия формата 7 не поддерживается, нужна 1");
  });
});

describe("испорченное состояние не проходит", () => {
  it.each([
    ["фильтр не объект", 42, "фильтр должен быть объектом"],
    [
      "условия не массив",
      { version: 1, conditions: {}, logic: { mode: "all" } },
      "условия должны быть массивом",
    ],
    [
      "неизвестный вид условия",
      { version: 1, conditions: [{ id: "c1", kind: "магия", field: "/a" }], logic: { mode: "all" } },
      "условие №1: неизвестный вид «магия»",
    ],
    [
      "неизвестный оператор",
      {
        version: 1,
        conditions: [{ id: "c1", kind: "compare", field: "/a", operator: "≈", value: "1" }],
        logic: { mode: "all" },
      },
      "условие №1: неизвестный оператор «≈»",
    ],
    [
      "ссылка на поле не путём",
      {
        version: 1,
        conditions: [{ id: "c1", kind: "compare", field: "applicant", operator: "eq", value: "1" }],
        logic: { mode: "all" },
      },
      "условие №1: ссылка на поле должна быть путём вида «/имя» (JSON Pointer)",
    ],
    [
      "условие без идентификатора",
      {
        version: 1,
        conditions: [{ kind: "compare", field: "/a", operator: "eq", value: "1" }],
        logic: { mode: "all" },
      },
      "условие №1: нет идентификатора",
    ],
    [
      "неизвестный узел логики",
      {
        version: 1,
        conditions: [{ id: "c1", kind: "compare", field: "/a", operator: "eq", value: "1" }],
        logic: { mode: "formula", expr: { t: "xor", a: { t: "ref", id: "c1" } } },
      },
      "логика: неизвестный узел логики «xor»",
    ],
  ])("%s", (_name, input, error) => {
    const parsed = parse(input);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error).toBe(error);
  });

  it("повторяющийся идентификатор условия — ошибка с адресом", () => {
    const parsed = parse({
      version: 1,
      conditions: [
        { id: "c1", kind: "compare", field: "/a", operator: "eq", value: "1" },
        { id: "c1", kind: "compare", field: "/b", operator: "eq", value: "2" },
      ],
      logic: { mode: "all" },
    });

    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error).toBe("идентификатор условия «c1» встречается дважды");
  });

  it("логика, ссылающаяся на несуществующее условие, не проходит границу", () => {
    const parsed = parse({
      version: 1,
      conditions: [{ id: "c1", kind: "compare", field: "/a", operator: "eq", value: "1" }],
      logic: { mode: "formula", expr: { t: "ref", id: "c9" } },
    });

    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error).toBe("логика ссылается на условия, которых нет: c9");
  });
});

describe("идентификаторы после чтения не сталкиваются", () => {
  it("счётчик двигается за прочитанные имена", () => {
    // Без этого условие, добавленное после чтения чужого состояния, получило бы уже занятое
    // имя — и правка одного условия меняла бы другое. Видно это стало бы только с сохранением.
    const parsed = parse({
      version: 1,
      conditions: [{ id: "c500", kind: "compare", field: "/a", operator: "eq", value: "1" }],
      logic: { mode: "all" },
    });

    expect(parsed.ok).toBe(true);
    const next = nextConditionId();
    expect(next).toBe("c501");
  });
});
