// Применение фильтра к строкам. Чистые функции: ни Solid, ни DOM здесь нет — модуль
// проверяется на голом массиве объектов, и это же держит его границу.
//
// Логика ТРЁХЗНАЧНАЯ (`truth.ts`): условие отвечает истина · ложь · неизвестно, а отбор
// пропускает строку только на «истина». Неизвестно возникает там, где сравнивать не с чем:
// поля нет, значение `null`, значение не разбирается по типу поля, условие не дозаполнено.

import { type FieldRef, type Row, hasField, isFilled, lookup } from "./field.js";
import { type Expr, danglingIds, defaultExpr } from "./formula.js";
import type {
  ComparisonCondition,
  ComparisonOperator,
  Condition,
  FieldDictionary,
  FieldType,
  FilterState,
  MemberCondition,
  PresenceCondition,
  RangeCondition,
} from "./model.js";
import { trace } from "./trace.js";
import { UNKNOWN, type Truth, and, not, or, passes } from "./truth.js";

export type { Lookup } from "./field.js";
export { hasField, isFilled } from "./field.js";

/**
 * Словарь полей для вычисления.
 *
 * Без него типы НЕ угадываются наугад: остаётся единственная подстраховка — если обе стороны
 * сравнения выглядят числами, сравниваем числами. Она была в модуле и раньше и оставлена,
 * чтобы вычислитель работал на голых данных без словаря (тесты, быстрый прогон).
 */
export interface EvaluateOptions {
  fields?: FieldDictionary;
}

type TypeIndex = ReadonlyMap<FieldRef, FieldType>;

function indexTypes(fields: FieldDictionary | undefined): TypeIndex {
  return new Map((fields ?? []).map((field) => [field.name, field.type]));
}

const DATE_DMY = /^(\d{2})\.(\d{2})\.(\d{4})$/;

/** Разбор даты: ISO 8601 (через `Date.parse`) и `дд.мм.гггг`. Иначе — не разобрано. */
function toTime(value: unknown): number | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.getTime();
  if (typeof value === "number") return value;
  if (typeof value !== "string") return null;

  const text = value.trim();
  if (text === "") return null;

  const dmy = DATE_DMY.exec(text);
  if (dmy) return Date.parse(`${dmy[3]}-${dmy[2]}-${dmy[1]}T00:00:00Z`);

  const parsed = Date.parse(text);
  return Number.isNaN(parsed) ? null : parsed;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isNaN(value) ? null : value;
  if (typeof value !== "string") return null;

  const text = value.trim();
  if (text === "") return null;

  const parsed = Number(text);
  return Number.isNaN(parsed) ? null : parsed;
}

const TRUE_WORDS = new Set(["true", "да", "1", "yes"]);
const FALSE_WORDS = new Set(["false", "нет", "0", "no"]);

function toBool(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1 ? true : value === 0 ? false : null;
  if (typeof value !== "string") return null;

  const text = value.trim().toLowerCase();
  if (TRUE_WORDS.has(text)) return true;
  if (FALSE_WORDS.has(text)) return false;
  return null;
}

function toText(value: unknown, sensitive: boolean): string {
  const text = String(value);
  return sensitive ? text : text.toLowerCase();
}

/** Пара значений, приведённая к сравнимому виду. `null` — привести не удалось. */
type Pair = { a: number; b: number } | { a: string; b: string } | null;

function comparable(
  actual: unknown,
  expected: string,
  type: FieldType | undefined,
  sensitive: boolean,
): Pair {
  switch (type) {
    case "number": {
      const a = toNumber(actual);
      const b = toNumber(expected);
      return a === null || b === null ? null : { a, b };
    }
    case "date": {
      const a = toTime(actual);
      const b = toTime(expected);
      return a === null || b === null ? null : { a, b };
    }
    case "bool": {
      const a = toBool(actual);
      const b = toBool(expected);
      // Булево сравнимо только на равенство; порядок над ним смысла не имеет, и здесь он
      // выражается как 0/1 сознательно — операторы порядка для булева поля не предлагаются.
      return a === null || b === null ? null : { a: Number(a), b: Number(b) };
    }
    case "text":
      return { a: toText(actual, sensitive), b: toText(expected.trim(), sensitive) };
    case undefined: {
      // Словаря нет: числа сравниваем числами, остальное — текстом. Смешение молча даёт «10 < 9».
      const a = toNumber(actual);
      const b = toNumber(expected);
      if (a !== null && b !== null) return { a, b };
      return { a: toText(actual, sensitive), b: toText(expected.trim(), sensitive) };
    }
  }
}

function compare(pair: NonNullable<Pair>, operator: ComparisonOperator): boolean {
  switch (operator) {
    case "eq":
      return pair.a === pair.b;
    case "ne":
      return pair.a !== pair.b;
    case "gt":
      return pair.a > pair.b;
    case "ge":
      return pair.a >= pair.b;
    case "lt":
      return pair.a < pair.b;
    case "le":
      return pair.a <= pair.b;
    case "contains":
      return String(pair.a).includes(String(pair.b));
  }
}

function matchComparison(row: Row, condition: ComparisonCondition, types: TypeIndex): Truth {
  const found = lookup(row, condition.field);
  // Поля нет — сравнивать не с чем. Это НЕИЗВЕСТНО, а не ложь: иначе `НЕ условие` пропускало
  // бы такие строки, а по канону SQL/CQL2 `NOT NULL = NULL` их не пропускает.
  if (!found.found || found.value === null || found.value === undefined) return UNKNOWN;

  const sensitive = condition.sensitive === true;
  const type = types.get(condition.field);

  // `contains` — про текст: подстрока в числе означала бы сравнение его текстового вида.
  if (condition.operator === "contains") {
    const actual = toText(found.value, sensitive);
    return actual.includes(toText(condition.value.trim(), sensitive));
  }

  const pair = comparable(found.value, condition.value, type, sensitive);
  // Значение не разбирается по объявленному типу («вчера» в поле-дате) — тоже неизвестно:
  // соврать «не равно» здесь дешевле всего и хуже всего.
  if (pair === null) return UNKNOWN;

  return compare(pair, condition.operator);
}

function matchMember(row: Row, condition: MemberCondition, types: TypeIndex): Truth {
  // Список пуст — условие не дозаполнено. `x IN ()` в SQL вообще синтаксическая ошибка;
  // у нас это обычное состояние ввода, и честный ответ — неизвестно, а не «ничего не подходит».
  if (condition.values.length === 0) return UNKNOWN;

  const found = lookup(row, condition.field);
  if (!found.found || found.value === null || found.value === undefined) return UNKNOWN;

  const type = types.get(condition.field);

  return condition.values.reduce<Truth>((total, value) => {
    const pair = comparable(found.value, value, type, false);
    return or(total, pair === null ? UNKNOWN : compare(pair, "eq"));
  }, false);
}

function matchRange(row: Row, condition: RangeCondition, types: TypeIndex): Truth {
  if (condition.from.trim() === "" || condition.to.trim() === "") return UNKNOWN;

  const found = lookup(row, condition.field);
  if (!found.found || found.value === null || found.value === undefined) return UNKNOWN;

  const type = types.get(condition.field);
  const low = comparable(found.value, condition.from, type, false);
  const high = comparable(found.value, condition.to, type, false);
  if (low === null || high === null) return UNKNOWN;

  // ВКЛЮЧИТЕЛЬНО с обеих сторон — CQL2 Requirement 6 говорит это прямо, и спорить не о чем.
  return and(compare(low, "ge"), compare(high, "le"));
}

function matchPresence(row: Row, condition: PresenceCondition): Truth {
  // Поля не выбраны — условие не дозаполнено, как и пустой список у `IN`.
  if (condition.fields.length === 0) return UNKNOWN;

  const check = condition.mode === "exists" ? hasField : isFilled;
  const hits = condition.fields.filter((field) => check(row, field)).length;

  // Само по себе наличие поля НЕИЗВЕСТНЫМ не бывает: это ответ про строку, а не про значение
  // (ср. `IS NULL` в CQL2 — тоже всегда истина или ложь).
  switch (condition.quantifier) {
    case "all":
      return hits === condition.fields.length;
    case "any":
      return hits > 0;
    case "none":
      return hits === 0;
  }
}

/** Проходит ли строка ОДНО условие: истина · ложь · неизвестно. */
export function matchCondition(
  row: Row,
  condition: Condition,
  options: EvaluateOptions = {},
): Truth {
  return matchWithTypes(row, condition, indexTypes(options.fields));
}

function matchWithTypes(row: Row, condition: Condition, types: TypeIndex): Truth {
  switch (condition.kind) {
    case "compare":
      return matchComparison(row, condition, types);
    case "in":
      return matchMember(row, condition, types);
    case "between":
      return matchRange(row, condition, types);
    case "presence":
      return matchPresence(row, condition);
  }
}

function evaluate(expr: Expr, results: ReadonlyMap<string, Truth>): Truth {
  switch (expr.t) {
    case "ref":
      return results.get(expr.id) ?? UNKNOWN;
    case "not":
      return not(evaluate(expr.a, results));
    case "and":
      return and(evaluate(expr.a, results), evaluate(expr.b, results));
    case "or":
      return or(evaluate(expr.a, results), evaluate(expr.b, results));
  }
}

export type Compiled =
  | { ok: true; predicate: (row: Row) => boolean; truth: (row: Row) => Truth }
  | { ok: false; error: string };

/**
 * Собрать из состояния готовый предикат.
 *
 * Возвращает ошибку, а не бросает: сломанная логика — обычное состояние ввода, а не сбой.
 * Рядом с `predicate` отдаётся `truth` — трёхзначный ответ для тех, кому нужно отличить
 * «не прошло» от «не смогли посчитать».
 */
export function compile(state: FilterState, options: EvaluateOptions = {}): Compiled {
  const conditions = state.conditions;
  const done = trace("compile");

  if (conditions.length === 0) {
    done("условий нет");
    return { ok: true, predicate: () => true, truth: () => true };
  }

  const ids = conditions.map((condition) => condition.id);
  const expr = state.logic.mode === "all" ? defaultExpr(ids) : state.logic.expr;
  if (expr === null) {
    done("условий нет");
    return { ok: true, predicate: () => true, truth: () => true };
  }

  const dangling = danglingIds(expr, ids);
  if (dangling.length > 0) {
    done("ссылка на удалённое условие");
    return {
      ok: false,
      error:
        dangling.length === 1
          ? "формула ссылается на условие, которого больше нет — поправьте формулу"
          : `формула ссылается на ${dangling.length} условия, которых больше нет — поправьте формулу`,
    };
  }

  const types = indexTypes(options.fields);
  const truth = (row: Row): Truth =>
    evaluate(
      expr,
      new Map(conditions.map((condition) => [condition.id, matchWithTypes(row, condition, types)])),
    );

  done(`условий ${conditions.length}`);
  return { ok: true, truth, predicate: (row: Row) => passes(truth(row)) };
}

/** Отфильтровать строки. Сломанная логика — строки возвращаются как есть, вместе с ошибкой. */
export function applyFilter(
  rows: readonly Row[],
  state: FilterState,
  options: EvaluateOptions = {},
): { rows: Row[]; error: string | null } {
  const done = trace("applyFilter");
  const compiled = compile(state, options);

  if (!compiled.ok) {
    done(`${rows.length} → ${rows.length} (ошибка)`);
    return { rows: [...rows], error: compiled.error };
  }

  const kept = rows.filter(compiled.predicate);
  done(`${rows.length} → ${kept.length}`);
  return { rows: kept, error: null };
}

/**
 * Сколько строк оставляет условие САМО ПО СЕБЕ — и на скольких ответ неизвестен.
 *
 * Именно само по себе, а не накопительно: при своей формуле «накопительный» счёт зависит от
 * порядка, которого в формуле нет, и число врало бы. Это тот счётчик, который отвечает на
 * вопрос «где сломалось» — самый частый при сборке фильтра.
 *
 * Второе число — единственное место, где трёхзначность выходит на экран: «оставляет 3 из 40,
 * неизвестно 12» сразу показывает, что дело в неполных данных, а не в самом условии.
 */
export function countMatching(
  rows: readonly Row[],
  condition: Condition,
  options: EvaluateOptions = {},
): { matched: number; unknown: number } {
  const types = indexTypes(options.fields);
  let matched = 0;
  let unknown = 0;

  for (const row of rows) {
    const value = matchWithTypes(row, condition, types);
    if (value === UNKNOWN) unknown += 1;
    else if (value) matched += 1;
  }

  return { matched, unknown };
}
