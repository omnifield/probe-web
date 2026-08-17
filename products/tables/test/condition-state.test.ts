// НЕДОПИСАННОСТЬ условия — состояние, которое едет наружу атрибутом и по которому одевают.
//
// Предмет отдельный от вычисления: недописанное условие вычисляется прекрасно, просто отбирает
// не то, что от него ждут. И отдельный от ошибки: условие законно недописано с той секунды,
// как его добавили, и ругаться на него сразу значит ругаться на человека за то, что он ещё не
// закончил печатать. Поэтому наружу это едет признаком, а показать его — и когда показать —
// решает тот, кто одевает.

import { describe, expect, it } from "vitest";

import { isIncomplete } from "../src/filters/model.js";
import type {
  ComparisonCondition,
  MemberCondition,
  PresenceCondition,
  RangeCondition,
} from "../src/filters/model.js";

const compare = (value: string): ComparisonCondition => ({
  id: "a",
  kind: "compare",
  field: "/applicant",
  operator: "contains",
  value,
});

const member = (values: string[]): MemberCondition => ({
  id: "a",
  kind: "in",
  field: "/applicant",
  values,
});

const range = (from: string, to: string): RangeCondition => ({
  id: "a",
  kind: "between",
  field: "/amount",
  from,
  to,
});

const presence = (fields: string[]): PresenceCondition => ({
  id: "a",
  kind: "presence",
  quantifier: "any",
  mode: "exists",
  fields,
});

describe("сравнение", () => {
  it("значение есть — дописано", () => {
    expect(isIncomplete(compare("Иванов"))).toBe(false);
  });

  it("значения нет — недописано", () => {
    expect(isIncomplete(compare(""))).toBe(true);
  });

  it("одни пробелы — тоже недописано", () => {
    // Пробел набирают, целясь в букву, а не чтобы искать пробел.
    expect(isIncomplete(compare("   "))).toBe(true);
  });
});

describe("одно из списка", () => {
  it("хотя бы одно значение заполнено — дописано", () => {
    expect(isIncomplete(member(["Иванов", ""]))).toBe(false);
  });

  it("список из одних пустых строк — тот же недописанный список, что и пустой", () => {
    expect(isIncomplete(member([""]))).toBe(true);
    expect(isIncomplete(member(["", "  "]))).toBe(true);
    expect(isIncomplete(member([]))).toBe(true);
  });
});

describe("диапазон", () => {
  it("достаточно ОДНОЙ границы — полуоткрытый диапазон осмыслен", () => {
    expect(isIncomplete(range("100", ""))).toBe(false);
    expect(isIncomplete(range("", "500"))).toBe(false);
  });

  it("обе границы пусты — недописано", () => {
    expect(isIncomplete(range("", ""))).toBe(true);
  });
});

describe("наличие полей", () => {
  it("поле выбрано — дописано", () => {
    expect(isIncomplete(presence(["/applicant"]))).toBe(false);
  });

  it("ни одного поля не выбрано — недописано", () => {
    expect(isIncomplete(presence([]))).toBe(true);
  });
});

describe("ноль и «нет» дописанностью не считаются пустыми", () => {
  // Значения-обманки: `0` и `нет` выглядят «пусто» на глаз, но набраны намеренно. Спутать их
  // с ненабранным значило бы гасить пометку у законно собранного условия — и наоборот.
  it("ноль — заполненное значение", () => {
    expect(isIncomplete(compare("0"))).toBe(false);
    expect(isIncomplete(range("0", "0"))).toBe(false);
  });

  it("«нет» — заполненное значение", () => {
    expect(isIncomplete(compare("нет"))).toBe(false);
  });
});
