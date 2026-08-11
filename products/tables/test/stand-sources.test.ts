// Демостенд: каждая форма данных доезжает до канона.
//
// Проба не про красоту стенда, а про его единственное утверждение: разные источники после
// переходника становятся одинаковыми. Если хоть один вариант отдаёт пустоту или ошибку —
// стенд показывает не то, что обещает.

import { describe, expect, it } from "vitest";

import { applyAdapter, parseAdapter } from "../src/adapter/index.js";
import { COLUMNS, SOURCES } from "../src/playground/data.js";
import { lookup } from "../src/filters/index.js";

describe("варианты структуры данных", () => {
  it("их несколько, и они разные", () => {
    expect(SOURCES.length).toBeGreaterThanOrEqual(3);
    expect(new Set(SOURCES.map((one) => one.id)).size).toBe(SOURCES.length);
  });

  it.each(SOURCES.map((one) => [one.label, one] as const))(
    "«%s» — переходник проходит ту же проверку, что и чужой файл",
    (_label, source) => {
      // Демонстрационные переходники не привилегированы: они читаются тем же разбором.
      const parsed = parseAdapter(JSON.parse(JSON.stringify(source.adapter)));
      expect(parsed.ok).toBe(true);
    },
  );

  it.each(SOURCES.map((one) => [one.label, one] as const))(
    "«%s» — доезжает до канона без ошибки и не пустым",
    (_label, source) => {
      const { rows, error } = applyAdapter(source.response, source.adapter);

      expect(error).toBeNull();
      expect(rows.length).toBeGreaterThan(0);
    },
  );

  it.each(SOURCES.map((one) => [one.label, one] as const))(
    "«%s» — заполняет несущие поля словаря",
    (_label, source) => {
      const { rows } = applyAdapter(source.response, source.adapter);
      const filled = (field: string) => rows.filter((row) => lookup(row, field).found).length;

      // Заявитель, сумма и регион — то, на чём стоят и отбор, и таблица, и график.
      expect(filled("/applicant")).toBeGreaterThan(0);
      expect(filled("/amount")).toBeGreaterThan(0);
      expect(filled("/region")).toBeGreaterThan(0);
    },
  );

  it("поля, которые заполняют переходники, есть в словаре", () => {
    // Иначе стенд показывал бы данные, для которых нет ни колонки, ни оператора фильтра.
    const known = new Set(COLUMNS.map((column) => column.name));

    for (const source of SOURCES) {
      for (const rule of source.adapter.fields) {
        expect({ source: source.id, target: rule.target, known: known.has(rule.target) }).toEqual({
          source: source.id,
          target: rule.target,
          known: true,
        });
      }
    }
  });

  it("у «нашего канона» переходник пустой — своему бэку он не нужен", () => {
    const canon = SOURCES.find((one) => one.id === "canon")!;
    expect(canon.adapter.fields).toEqual([]);
    expect(canon.adapter.extra).toBe("keep");
  });
});
