// Отбор → SQL: показ договора для бэка.
//
// Проверяется не «строка похожа на SQL», а то, из-за чего бэк напишет не то:
//   • значения НИКОГДА не вклеиваются в текст — только параметрами;
//   • трёхзначная логика переносится точно, а не «примерно»;
//   • всё, что переведено приблизительно, НАЗВАНО в оговорках, а не спрятано.

import { describe, expect, it } from "vitest";

import {
  EMPTY_FILTER,
  type FieldDictionary,
  type FilterState,
  filterToSql,
} from "../src/filters/index.js";
import { chartToSql } from "../src/chart/index.js";
import { EMPTY_SESSION, EMPTY_VIEW, viewToSql } from "../src/table/index.js";

const FIELDS: FieldDictionary = [
  { name: "/applicant", label: "заявитель", type: "text" },
  { name: "/amount", label: "сумма", type: "number" },
  { name: "/created", label: "заведена", type: "date" },
  { name: "/contact/phone", label: "телефон", type: "text" },
];

const state = (conditions: FilterState["conditions"], logic: FilterState["logic"] = { mode: "all" }): FilterState => ({
  ...EMPTY_FILTER,
  conditions,
  logic,
});

const sql = (one: FilterState) => filterToSql(one, { fields: FIELDS, table: "applications" });

describe("значения едут ПАРАМЕТРАМИ", () => {
  it("ни одного значения в тексте запроса", () => {
    const query = sql(
      state([{ id: "c-1", kind: "compare", field: "/applicant", operator: "eq", value: "Иванов" }]),
    );

    expect(query.text).not.toContain("Иванов");
    expect(query.params).toEqual(["Иванов"]);
  });

  it("кавычка в значении никуда не вклеивается — вклеивать нечего", () => {
    const query = sql(
      state([
        { id: "c-1", kind: "compare", field: "/applicant", operator: "eq", value: "'; DROP TABLE t;--" },
      ]),
    );

    expect(query.text).not.toContain("DROP");
    expect(query.params).toEqual(["'; DROP TABLE t;--"]);
  });

  it("знак места — по диалекту: свод даёт `?`, PostgreSQL нумерует", () => {
    const one = state([
      { id: "c-1", kind: "compare", field: "/amount", operator: "gt", value: "100" },
      { id: "c-2", kind: "compare", field: "/amount", operator: "lt", value: "900" },
    ]);

    expect(filterToSql(one, { fields: FIELDS }).text).toContain("amount > ?");
    expect(filterToSql(one, { fields: FIELDS, dialect: "postgres" }).text).toContain("amount > $1");
    expect(filterToSql(one, { fields: FIELDS, dialect: "postgres" }).text).toContain("amount < $2");
  });
});

describe("перевод условий", () => {
  it("текст сравнивается без учёта регистра, число — как есть", () => {
    const query = sql(
      state([
        { id: "c-1", kind: "compare", field: "/applicant", operator: "eq", value: "иванов" },
        { id: "c-2", kind: "compare", field: "/amount", operator: "ge", value: "100" },
      ]),
    );

    expect(query.text).toContain("LOWER(applicant) = LOWER(?)");
    expect(query.text).toContain("amount >= ?");
  });

  it("флажок «учитывать регистр» убирает приведение", () => {
    const query = sql(
      state([
        { id: "c-1", kind: "compare", field: "/applicant", operator: "eq", value: "Иванов", sensitive: true },
      ]),
    );

    expect(query.text).toContain("applicant = ?");
    expect(query.text).not.toContain("LOWER");
  });

  it("«содержит» — это LIKE с образцом в ПАРАМЕТРЕ, а не в тексте", () => {
    const query = sql(
      state([{ id: "c-1", kind: "compare", field: "/applicant", operator: "contains", value: "ван" }]),
    );

    expect(query.text).toContain("LIKE");
    expect(query.params).toEqual(["%ван%"]);
  });

  it("«одно из» — один IN, а не N условий через ИЛИ", () => {
    const query = sql(
      state([{ id: "c-1", kind: "in", field: "/applicant", values: ["Москва", "Тула"] }]),
    );

    expect(query.text).toContain("IN (?, ?)");
    expect(query.params).toEqual(["Москва", "Тула"]);
  });

  it("диапазон — BETWEEN: границы включительны, как в CQL2", () => {
    const query = sql(
      state([
        { id: "c-1", kind: "between", field: "/created", from: "2026-06-01", to: "2026-08-31" },
      ]),
    );

    expect(query.text).toContain("created BETWEEN ? AND ?");
  });

  it("вложенное поле: свод — JSON_VALUE, PostgreSQL — свой оператор, и это НАЗВАНО", () => {
    const one = state([
      { id: "c-1", kind: "compare", field: "/contact/phone", operator: "contains", value: "+7" },
    ]);

    const std = filterToSql(one, { fields: FIELDS });
    expect(std.text).toContain("JSON_VALUE(contact, '$.phone')");
    expect(std.notes.join(" ")).toMatch(/JSON_VALUE/);

    const pg = filterToSql(one, { fields: FIELDS, dialect: "postgres" });
    expect(pg.text).toContain("contact->>'phone'");
    expect(pg.notes.join(" ")).toMatch(/не из свода/);
  });

  it("наличие поля: `IS NOT NULL`, и приблизительность перевода названа", () => {
    const query = sql(
      state([
        {
          id: "c-1",
          kind: "presence",
          quantifier: "none",
          mode: "exists",
          fields: ["/applicant", "/amount"],
        },
      ]),
    );

    expect(query.text).toContain("NOT (applicant IS NOT NULL OR amount IS NOT NULL)");
    expect(query.notes.join(" ")).toMatch(/«поля нет вовсе» в SQL не выражается/);
  });

  it("«заполнено» — это не только «есть»", () => {
    const query = sql(
      state([
        { id: "c-1", kind: "presence", quantifier: "all", mode: "filled", fields: ["/applicant"] },
      ]),
    );

    expect(query.text).toContain("applicant IS NOT NULL AND applicant <> ''");
  });
});

describe("логика", () => {
  it("по умолчанию всё через И", () => {
    const query = sql(
      state([
        { id: "c-1", kind: "compare", field: "/amount", operator: "gt", value: "100" },
        { id: "c-2", kind: "compare", field: "/applicant", operator: "eq", value: "Иванов" },
      ]),
    );

    expect(query.text).toMatch(/WHERE amount > \? AND LOWER\(applicant\) = LOWER\(\?\)/);
  });

  it("формула переносится со скобками и с НЕ", () => {
    const query = sql(
      state(
        [
          { id: "c-1", kind: "compare", field: "/amount", operator: "gt", value: "100" },
          { id: "c-2", kind: "compare", field: "/applicant", operator: "eq", value: "Иванов" },
        ],
        {
          mode: "formula",
          expr: { t: "and", a: { t: "ref", id: "c-1" }, b: { t: "not", a: { t: "ref", id: "c-2" } } },
        },
      ),
    );

    expect(query.text).toContain("(amount > ? AND NOT LOWER(applicant) = LOWER(?))");
  });

  it("НЕДОЗАПОЛНЕННОЕ условие переводится в «неизвестно», а не выбрасывается", () => {
    // В отборе такое условие отвечает «неизвестно» и не пропускает строку. В SQL то же самое
    // даёт сравнение с NULL — если бы условие просто выкинули, запрос вернул бы БОЛЬШЕ строк.
    const query = sql(
      state([{ id: "c-1", kind: "compare", field: "/applicant", operator: "eq", value: "" }]),
    );

    expect(query.text).toContain("(NULL = NULL)");
    expect(query.params).toEqual([]);
    expect(query.notes.join(" ")).toMatch(/не пропускает/);
  });

  it("пустой отбор — запрос без WHERE вовсе", () => {
    const query = sql(EMPTY_FILTER);

    expect(query.text).toBe("SELECT * FROM applications");
    expect(query.text).not.toContain("WHERE");
  });
});

describe("порядок и страница", () => {
  it("место пустого объявляется явно: по возрастанию — в конец, по убыванию — в начало", () => {
    const tail = viewToSql(
      { ...EMPTY_VIEW, sorting: [{ field: "/amount", direction: "desc" }] },
      EMPTY_SESSION,
    );

    expect(tail.order).toBe("ORDER BY amount DESC NULLS FIRST");
    expect(tail.notes.join(" ")).toMatch(/порядок обязан быть ПОЛНЫМ/i);
  });

  it("страница считается смещением, и хрупкость смещения названа заранее", () => {
    const tail = viewToSql({ ...EMPTY_VIEW, pageSize: 10 }, { ...EMPTY_SESSION, page: 2 });

    expect(tail.page).toBe("LIMIT 10 OFFSET 20");
    expect(tail.notes.join(" ")).toMatch(/курсор/);
  });

  it("без сортировки и без листания хвоста нет", () => {
    const tail = viewToSql(EMPTY_VIEW, EMPTY_SESSION);

    expect(tail.order).toBe("");
    expect(tail.page).toBe("");
  });
});

describe("график шлёт СВОЙ запрос", () => {
  it("срез и мера превращаются в группировку и сведение", () => {
    const chart = chartToSql({
      version: 1,
      mark: "bar",
      slice: "/region",
      measure: { field: "/amount", aggregate: "sum" },
      order: "value-desc",
    });

    expect(chart.select).toBe("SELECT region AS slice, SUM(amount) AS value");
    expect(chart.groupBy).toBe("GROUP BY region");
    expect(chart.order).toBe("ORDER BY value DESC");
  });

  it("имена методов рыночные, а в SQL переводятся: average → AVG, countdistinct → COUNT(DISTINCT)", () => {
    const average = chartToSql({
      version: 1,
      mark: "bar",
      slice: "/region",
      measure: { field: "/amount", aggregate: "average" },
    });
    const distinct = chartToSql({
      version: 1,
      mark: "bar",
      slice: "/region",
      measure: { field: "/status", aggregate: "countdistinct" },
    });

    expect(average.select).toContain("AVG(amount)");
    expect(distinct.select).toContain("COUNT(DISTINCT status)");
  });

  it("«сколько» считает СТРОКИ, и поле ему не нужно", () => {
    const chart = chartToSql({
      version: 1,
      mark: "bar",
      slice: "/region",
      measure: { aggregate: "count" },
    });

    expect(chart.select).toContain("COUNT(*) AS value");
  });

  it("разбивка на серии добавляет второй ключ группировки", () => {
    const chart = chartToSql({
      version: 1,
      mark: "bar",
      slice: "/region",
      series: "/status",
      measure: { aggregate: "count" },
    });

    expect(chart.select).toContain("status AS series");
    expect(chart.groupBy).toBe("GROUP BY region, status");
  });

  it("«как в данных» хвоста не даёт: порядка строк без ORDER BY в SQL не бывает", () => {
    const chart = chartToSql({
      version: 1,
      mark: "bar",
      slice: "/region",
      measure: { aggregate: "count" },
      order: "natural",
    });

    expect(chart.order).toBe("");
  });

  it("строки без значения среза — видимая категория, и это НАЗВАНО бэку", () => {
    const chart = chartToSql({
      version: 1,
      mark: "bar",
      slice: "/region",
      measure: { aggregate: "count" },
    });

    expect(chart.notes.join(" ")).toMatch(/IS NULL/);
  });
});
