// Живая проба L2: чужая запись с несовпадающими именами/значениями → канон, с отчётом о том,
// что не легло.

import { describe, expect, it } from "vitest";

import { applyFieldRules, collectFieldRuleReport, type FieldRule } from "../src/index.js";

const fields: FieldRule[] = [
  { target: "/id", from: "/code" },
  { target: "/amount", from: "/sum_kop", steps: [{ kind: "number" }, { kind: "divide", by: 100 }] },
  {
    target: "/status",
    from: "/state",
    steps: [{ kind: "dictionary", values: { A: "active" }, otherwise: "fail" }],
    onFail: "reject",
  },
];

describe("applyFieldRules — одна запись", () => {
  it("собирает канон по правилам, лишнее чужое поле не проносит (extra: drop по умолчанию)", () => {
    const { row, issues } = applyFieldRules({ code: "s1", sum_kop: "12345", state: "A", junk: 1 }, fields);

    expect(row).toEqual({ id: "s1", amount: 123.45, status: "active" });
    expect(issues).toEqual([]);
  });

  it("extra: keep проносит чужое как есть рядом с каноном", () => {
    const { row } = applyFieldRules({ code: "s1", sum_kop: "100", state: "A", junk: 1 }, fields, "keep");
    expect(row).toMatchObject({ junk: 1, id: "s1" });
  });

  it("onFail: reject бракует ЗАПИСЬ целиком (row: null), а не только поле", () => {
    const { row, issues } = applyFieldRules({ code: "s1", sum_kop: "100", state: "неизвестно" }, fields);

    expect(row).toBeNull();
    expect(issues).toEqual([expect.objectContaining({ reason: expect.stringContaining("нет в словаре") })]);
  });

  it("onFail по умолчанию (skip) — поля просто нет, запись всё равно собирается", () => {
    const noReject: FieldRule[] = [{ target: "/id", from: "/code" }, { target: "/label", from: "/missing" }];
    const { row } = applyFieldRules({ code: "s1" }, noReject);

    expect(row).toEqual({ id: "s1" });
  });
});

describe("collectFieldRuleReport — множество записей", () => {
  it("считает converted/rejected и агрегирует одинаковые беды в один issue с count", () => {
    const sources = [
      { code: "s1", sum_kop: "100", state: "A" },
      { code: "s2", sum_kop: "200", state: "неизвестно" },
      { code: "s3", sum_kop: "300", state: "тоже неизвестно" },
    ];

    const { rows, report } = collectFieldRuleReport(sources, fields);

    expect(rows).toHaveLength(1);
    expect(report).toMatchObject({ total: 3, converted: 1, rejected: 2 });
    expect(report.issues).toEqual([
      expect.objectContaining({ target: "/status", reason: expect.stringContaining("нет в словаре"), count: 2 }),
    ]);
  });

  it("называет их поля, для которых правил нет вовсе (unmapped)", () => {
    const sources = [{ code: "s1", sum_kop: "100", state: "A", extra_field: "x" }];
    const { report } = collectFieldRuleReport(sources, fields);

    expect(report.unmapped).toEqual([{ path: "/extra_field", count: 1 }]);
  });
});

describe("приём и отдача — два независимых списка FieldRule[]", () => {
  // Отдача НЕ выведена разворотом `fields` (приём) — написана руками отдельно, тем же движком.
  const back: FieldRule[] = [
    { target: "/code", from: "/id" },
    { target: "/sum_kop", from: "/amount", steps: [{ kind: "multiply", by: 100 }, { kind: "round" }] },
    { target: "/state", from: "/status", steps: [{ kind: "dictionary", values: { active: "A" }, otherwise: "fail" }] },
  ];

  it("applyFieldRules с `fields` — приём (их формат → канон)", () => {
    const { row } = applyFieldRules({ code: "s1", sum_kop: "12345", state: "A" }, fields);
    expect(row).toEqual({ id: "s1", amount: 123.45, status: "active" });
  });

  it("applyFieldRules с `back` — отдача (канон → их формат), тот же движок, другой список", () => {
    const { row } = applyFieldRules({ id: "s1", amount: 123.45, status: "active" }, back);
    expect(row).toEqual({ code: "s1", sum_kop: 12345, state: "A" });
  });
});
