// Отбор → SQL. Показ для БЭКА: вот что мы вам пришлём.
//
// Это не транспорт и не «фильтрация на сервере»: транспорт появится отдельно. Здесь ровно одно —
// **сделать наш отбор читаемым для того, кто пишет бэк**, до того как он напишет не то. Договор
// на словах («ну там условия и логика») расходится молча; текст запроса с параметрами — нет.
//
// Сверка с рынком 2026-08-13 (веб):
//
//   • **Параметры, а не литералы.** Значения никогда не вклеиваются в текст: SQL92 задаёт для
//     динамических параметров знак `?`, его же взяли ODBC и JDBC, и он работает у большинства
//     СУБД. PostgreSQL `?` не принимает — у него это оператор, — и нумерует свои: `$1`, `$2`.
//     Поэтому знак выбирается диалектом, а не зашит. Источники: PostgreSQL «PREPARE»,
//     pgJDBC «Issuing a Query», обсуждение `$n` vs `?` в списке рассылки PostgreSQL.
//   • **Вложенное поле.** Операторы `->` / `->>` — СВОИ у PostgreSQL, в своде их нет; SQL:2016
//     ввёл `JSON_VALUE(col, '$.path')` с JSONPath, и его понимают несколько СУБД. Значит
//     переносимый вариант — стандартный, а постгресовый предлагается вторым.
//   • **Трёхзначная логика достаётся даром.** Она и так канон SQL-семьи (мы взяли её у CQL2 и
//     PostgreSQL ещё в первой волне), и `WHERE` пропускает только истину — ровно как наш отбор.
//     Поэтому перевод условий прямой, а не «примерно такой же».
//
// Чего SQL сказать НЕ МОЖЕТ, и это названо в `notes`, а не спрятано: у строки в таблице поле
// либо есть, либо `NULL` — «поля нет вовсе» там не выражается. Наш `exists` переводится как
// `IS NOT NULL`, и это единственное место, где перевод приблизительный.

import type {
  Condition,
  FieldDictionary,
  FieldRef,
  FieldType,
  FilterState,
  Logic,
} from "./model.js";
import type { Expr } from "./formula.js";
import { trace } from "./trace.js";

export type SqlDialect = "standard" | "postgres";

export interface SqlOptions {
  /** Таблица, к которой поедет запрос. Догадка стенда — бэк подставит своё. */
  table?: string;
  dialect?: SqlDialect;
  /**
   * Словарь полей. Без него ТИП поля неизвестен, и текстовое сравнение не отличить от
   * числового: приводить регистр у суммы бессмысленно, а не приводить у имени — неверно.
   */
  fields?: FieldDictionary;
}

export interface SqlQuery {
  /** Готовый `SELECT * FROM …` с условием — то, что шлёт таблица. */
  text: string;
  /**
   * Только условие, БЕЗ слова `WHERE` и без `SELECT`. Отдельно — потому что график шлёт тот же
   * отбор с другим началом и с группировкой: собрать его из готового `SELECT *` можно было бы
   * только разбором строки, а это гадание.
   */
  where: string;
  /** Значения по порядку мест. */
  params: string[];
  /** Что перевелось приблизительно и о чём бэку надо знать. Пусто — переводить было нечего. */
  notes: string[];
}

const IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** Разбор ссылки-пути (JSON Pointer, RFC 6901): раскодирование строго `~1` → `/`, потом `~0` → `~`. */
function segments(field: FieldRef): string[] {
  return field
    .replace(/^\//, "")
    .split("/")
    .map((part) => part.replace(/~1/g, "/").replace(/~0/g, "~"));
}

/** Имя в кавычках, когда иначе нельзя: пробел, дефис, кириллица, ключевое слово. */
function ident(name: string): string {
  return IDENT.test(name) ? name : `"${name.replace(/"/g, '""')}"`;
}

/**
 * Поле → выражение колонки. Первый сегмент пути — колонка, остальные — путь внутри JSON.
 *
 * Ровно здесь живёт единственное предположение о схеме бэка: что верхний уровень нашего пути
 * это его колонка. Оно названо в `notes`, а не сделано молча.
 */
export function sqlColumn(field: FieldRef, dialect: SqlDialect = "standard"): string {
  const [head, ...rest] = segments(field);
  const base = ident(head ?? "");
  if (rest.length === 0) return base;

  const path = rest.join(".");
  return dialect === "postgres"
    ? `${base}->>'${rest.join("'->>'")}'`
    : `JSON_VALUE(${base}, '$.${path}')`;
}

const COMPARISON: Record<string, string> = {
  eq: "=",
  ne: "<>",
  gt: ">",
  ge: ">=",
  lt: "<",
  le: "<=",
};

/** Условие не дозаполнено — в отборе это «неизвестно». В SQL то же самое даёт сравнение с NULL. */
const UNKNOWN_SQL = "(NULL = NULL)";

class Writer {
  readonly params: string[] = [];
  readonly notes = new Set<string>();

  constructor(
    private readonly dialect: SqlDialect,
    private readonly types: Map<FieldRef, FieldType>,
  ) {}

  /** Тип поля из словаря; без словаря считаем текстом — ровно как вычислитель отбора. */
  private typeOf(field: FieldRef): FieldType {
    return this.types.get(field) ?? "text";
  }

  /** Значение уезжает ПАРАМЕТРОМ. Вклеенное значение — это внедрение, а не форматирование. */
  place(value: string): string {
    this.params.push(value);
    return this.dialect === "postgres" ? `$${this.params.length}` : "?";
  }

  note(text: string): void {
    this.notes.add(text);
  }

  column(field: FieldRef): string {
    const [, ...rest] = segments(field);
    if (rest.length > 0) {
      this.note(
        this.dialect === "postgres"
          ? "Вложенные поля читаются операторами PostgreSQL `->>`; они не из свода."
          : "Вложенные поля читаются `JSON_VALUE` (SQL:2016). Если у вас они лежат колонками — скажите, перевод поправим.",
      );
    }
    return sqlColumn(field, this.dialect);
  }

  condition(condition: Condition): string {
    switch (condition.kind) {
      case "compare": {
        if (condition.value.trim() === "") {
          this.note("Недозаполненное условие переведено как «неизвестно» — оно ничего не пропускает.");
          return UNKNOWN_SQL;
        }

        const left = this.column(condition.field);
        if (condition.operator === "contains") {
          const place = this.place(`%${condition.value}%`);
          // Регистр: у нас флаг у условия, у рынка два оператора (`like`/`ilike`). В своде
          // регистронезависимого LIKE нет, поэтому приводим обе стороны — работает везде.
          return condition.sensitive === true
            ? `${left} LIKE ${place}`
            : `LOWER(${left}) LIKE LOWER(${place})`;
        }

        const sign = COMPARISON[condition.operator] ?? "=";
        const place = this.place(condition.value);

        if (this.typeOf(condition.field) !== "text") {
          // Значения едут строками: типизацию делает драйвер, а не склейка текста.
          this.note("Значения уезжают параметрами-строками — типы подставьте своими параметрами.");
          return `${left} ${sign} ${place}`;
        }

        // Текст у нас сравнивается без учёта регистра, пока не поставлен флажок у условия.
        return condition.sensitive === true
          ? `${left} ${sign} ${place}`
          : `LOWER(${left}) ${sign} LOWER(${place})`;
      }

      case "in": {
        const values = condition.values.filter((value) => value.trim() !== "");
        if (values.length === 0) {
          this.note("Пустой список в условии «одно из» не пропускает ничего — так же и в отборе.");
          return "FALSE";
        }
        const left = this.column(condition.field);
        return `${left} IN (${values.map((value) => this.place(value)).join(", ")})`;
      }

      case "between": {
        if (condition.from.trim() === "" || condition.to.trim() === "") {
          this.note("Недозаполненное условие переведено как «неизвестно» — оно ничего не пропускает.");
          return UNKNOWN_SQL;
        }
        const left = this.column(condition.field);
        // Границы включительны — так сказано в CQL2, и `BETWEEN` в SQL ровно такой же.
        return `${left} BETWEEN ${this.place(condition.from)} AND ${this.place(condition.to)}`;
      }

      case "presence": {
        if (condition.fields.length === 0) {
          this.note("Условие по наличию полей без единого поля не пропускает ничего.");
          return "FALSE";
        }

        this.note(
          "У строки в таблице поля либо есть, либо `NULL`: «поля нет вовсе» в SQL не выражается, поэтому «есть поле» переведено как `IS NOT NULL`.",
        );

        const each = condition.fields.map((field) => {
          const left = this.column(field);
          return condition.mode === "filled"
            ? `(${left} IS NOT NULL AND ${left} <> '')`
            : `${left} IS NOT NULL`;
        });

        if (condition.quantifier === "all") return `(${each.join(" AND ")})`;
        if (condition.quantifier === "none") return `NOT (${each.join(" OR ")})`;
        return `(${each.join(" OR ")})`;
      }
    }
  }
}

function expr(node: Expr, by: Map<string, string>, writer: Writer): string {
  switch (node.t) {
    case "ref": {
      const rendered = by.get(node.id);
      if (rendered !== undefined) return rendered;
      // Формула ссылается на условие, которого нет: в конструкторе это `?` и названная ошибка.
      writer.note("Формула ссылается на удалённое условие — в запросе оно «неизвестно».");
      return UNKNOWN_SQL;
    }
    case "not":
      return `NOT ${expr(node.a, by, writer)}`;
    case "and":
      return `(${expr(node.a, by, writer)} AND ${expr(node.b, by, writer)})`;
    case "or":
      return `(${expr(node.a, by, writer)} OR ${expr(node.b, by, writer)})`;
  }
}

function where(logic: Logic, rendered: Map<string, string>, writer: Writer): string {
  const all = [...rendered.values()];
  if (all.length === 0) return "";
  if (logic.mode === "all") return all.join(" AND ");
  return expr(logic.expr, rendered, writer);
}

/**
 * Отбор → условие `WHERE` с параметрами.
 *
 * @param state состояние отбора
 * @param options таблица и диалект
 * @returns текст, параметры по порядку и оговорки перевода
 */
export function filterToSql(state: FilterState, options: SqlOptions = {}): SqlQuery {
  const done = trace("filterToSql");
  const dialect = options.dialect ?? "standard";
  const types = new Map<FieldRef, FieldType>(
    (options.fields ?? []).map((spec) => [spec.name, spec.type ?? "text"]),
  );
  const writer = new Writer(dialect, types);

  const rendered = new Map<string, string>();
  for (const condition of state.conditions) {
    rendered.set(condition.id, writer.condition(condition));
  }

  const clause = where(state.logic, rendered, writer);
  const table = options.table ?? "applications";

  const text = clause === "" ? `SELECT * FROM ${table}` : `SELECT * FROM ${table}\nWHERE ${clause}`;

  done(`${state.conditions.length} условий, ${writer.params.length} параметров`);
  return { text, where: clause, params: writer.params, notes: [...writer.notes] };
}
