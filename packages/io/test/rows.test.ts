// Живая проба L3: чужой ответ, завёрнутый в конверт (`/data/items`) → набор путей-кандидатов,
// пути внутри записи, канон целиком с отчётом.

import { describe, expect, it } from "vitest";

import { collectRowsReport, discoverRowPaths, discoverRowSets, type FieldRule } from "../src/index.js";

const feed = {
  meta: { page: 1 },
  data: {
    items: [
      { code: "s1", sum_kop: "12345", state: "A" },
      { code: "s2", sum_kop: "200", state: "неизвестно" },
    ],
  },
};

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

describe("discoverRowSets — предлагает пути-кандидаты, не выбирает сам", () => {
  it("находит завёрнутый набор записей, `meta` (не массив) не предлагает", () => {
    expect(discoverRowSets(feed)).toEqual(["/data/items"]);
  });

  it("пустой массив/массив не-объектов — не кандидат", () => {
    expect(discoverRowSets({ empty: [], tags: ["a", "b"] })).toEqual([]);
  });
});

describe("discoverRowPaths — пути ВНУТРИ первой записи набора", () => {
  it("по выбранному пути до набора показывает пути первой записи", () => {
    expect(discoverRowPaths(feed, "/data/items")).toEqual(["/code", "/sum_kop", "/state"]);
  });

  it("путь пустой — сами данные целиком уже набор", () => {
    expect(discoverRowPaths(feed.data.items, "")).toEqual(["/code", "/sum_kop", "/state"]);
  });

  it("путь не найден — пустой список, а не поля входа целиком по ошибке", () => {
    expect(discoverRowPaths(feed, "/data/missing")).toEqual([]);
  });
});

describe("collectRowsReport — путь до набора + правила поля → канон целиком", () => {
  it("достаёт набор по пути и дальше работает как collectFieldRuleReport", () => {
    const { rows, report, error } = collectRowsReport(feed, "/data/items", fields);

    expect(error).toBeNull();
    expect(rows).toEqual([{ id: "s1", amount: 123.45, status: "active" }]);
    expect(report).toMatchObject({ total: 2, converted: 1, rejected: 1 });
  });

  it("путь мимо набора — явная структурная ошибка, а не пустой отчёт по недоразумению", () => {
    const result = collectRowsReport(feed, "/data/missing", fields);

    expect(result.error).toMatch(/набора записей нет/);
    expect(result.rows).toEqual([]);
  });

  it("путь пустой, а вход — не массив — тоже структурная ошибка", () => {
    const result = collectRowsReport(feed, "", fields);
    expect(result.error).toMatch(/ожидался массив записей/);
  });

  it("не-объектные записи набора (null, строка) считаются, а не выбрасываются молча", () => {
    const messy = { data: { items: [{ code: "s1", sum_kop: "100", state: "A" }, null, "junk"] } };
    const { rows, report, error } = collectRowsReport(messy, "/data/items", fields);

    expect(error).toBeNull();
    expect(rows).toEqual([{ id: "s1", amount: 1, status: "active" }]);
    expect(report).toMatchObject({ total: 3, converted: 1, rejected: 2 });
    expect(report.issues).toEqual([
      expect.objectContaining({ target: "/data/items", reason: "запись — не объект", count: 2, examples: ["junk"] }),
    ]);
  });
});
