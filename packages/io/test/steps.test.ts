import { describe, expect, it } from "vitest";

import { isBlank, runStep, runSteps, MAX_STEPS, type Step } from "../src/steps.js";

describe("isBlank", () => {
  it("null/undefined/пустая строка/пробелы/пустой массив — пусто", () => {
    expect(isBlank(null)).toBe(true);
    expect(isBlank(undefined)).toBe(true);
    expect(isBlank("   ")).toBe(true);
    expect(isBlank([])).toBe(true);
    expect(isBlank(0)).toBe(false);
    expect(isBlank("x")).toBe(false);
  });
});

describe("runStep", () => {
  it("trim/lower/upper", () => {
    expect(runStep({ kind: "trim" }, "  x  ", {})).toEqual({ ok: true, value: "x" });
    expect(runStep({ kind: "lower" }, "AB", {})).toEqual({ ok: true, value: "ab" });
    expect(runStep({ kind: "upper" }, "ab", {})).toEqual({ ok: true, value: "AB" });
  });

  it("concat склеивает значение с чужими полями через readFrom", () => {
    const step: Step = { kind: "concat", parts: [{ from: "/last" }], separator: " " };
    expect(runStep(step, "Иван", { last: "Иванов" })).toEqual({ ok: true, value: "Иван Иванов" });
  });

  it("concat — нечего склеивать, явный отказ", () => {
    expect(runStep({ kind: "concat", parts: [] }, undefined, {})).toEqual({
      ok: false,
      reason: "склеивать нечего",
    });
  });

  it("number принимает запятую и пробелы-разделители", () => {
    expect(runStep({ kind: "number" }, "1 234,5", {})).toEqual({ ok: true, value: 1234.5 });
  });

  it("divide на ноль — явный отказ, не Infinity", () => {
    expect(runStep({ kind: "divide", by: 0 }, "10", {})).toEqual({ ok: false, reason: "деление на ноль" });
  });

  it("date разбирает дд.мм.гггг в ISO", () => {
    expect(runStep({ kind: "date", from: "dmy" }, "01.03.2026", {})).toEqual({
      ok: true,
      value: "2026-03-01T00:00:00.000Z",
    });
  });

  it("dictionary — otherwise:keep оставляет несловарное значение как есть", () => {
    const step: Step = { kind: "dictionary", values: { a: "A" }, otherwise: "keep" };
    expect(runStep(step, "b", {})).toEqual({ ok: true, value: "b" });
  });

  it("dictionary — otherwise:fail бракует несловарное значение", () => {
    const step: Step = { kind: "dictionary", values: { a: "A" }, otherwise: "fail" };
    expect(runStep(step, "b", {})).toEqual({ ok: false, reason: "нет в словаре" });
  });

  it("coalesce берёт первое непустое из перечисленных путей", () => {
    const step: Step = { kind: "coalesce", from: ["/a", "/b"] };
    expect(runStep(step, undefined, { a: "", b: "x" })).toEqual({ ok: true, value: "x" });
  });
});

describe("runSteps", () => {
  it("цепочка обрывается на первой неудаче", () => {
    const steps: Step[] = [{ kind: "number" }, { kind: "round", digits: 1 }];
    expect(runSteps(steps, "не число", {})).toEqual({
      ok: false,
      reason: "шаг 1 (number): не число",
    });
  });

  it("цепочка длиннее MAX_STEPS — явный отказ, не выполнение", () => {
    const steps: Step[] = Array.from({ length: MAX_STEPS + 1 }, () => ({ kind: "trim" }) as Step);
    expect(runSteps(steps, "x", {}).ok).toBe(false);
  });
});
