// Живая проба L2 (PWEB-183) — тот же мотивирующий случай, что у `tables/adapter`: чужая запись
// с несовпадающими именами/значениями → канон, с отчётом о том, что не легло.

import { describe, expect, it } from "vitest";
import { z } from "zod";

import { applyFieldRules, collectFieldRuleReport, fieldRulesCodec, type FieldRule } from "../src/field-rules.js";

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

describe("fieldRulesCodec", () => {
  const input = z.record(z.string(), z.unknown());
  const output = z.object({ id: z.string(), amount: z.number(), status: z.string() });

  it("decode собирает канон и проверяет его output-схемой", () => {
    const codec = fieldRulesCodec(input, output, fields);

    expect(codec.decode({ code: "s1", sum_kop: "12345", state: "A" })).toEqual({
      id: "s1",
      amount: 123.45,
      status: "active",
    });
  });

  it("decode бросает явно на забракованную запись — не тихий null", () => {
    const codec = fieldRulesCodec(input, output, fields);

    expect(() => codec.decode({ code: "s1", sum_kop: "100", state: "неизвестно" })).toThrow(/status/);
  });

  it("encode сегодня явно не реализован — бросает, а не притворяется", () => {
    const codec = fieldRulesCodec(input, output, fields);

    expect(() => codec.encode({ id: "s1", amount: 1, status: "active" })).toThrow(/не реализован/);
  });
});
