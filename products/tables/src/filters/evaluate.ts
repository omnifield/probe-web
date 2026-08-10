// Применение фильтра к строкам. Чистые функции: ни Solid, ни DOM здесь нет — модуль
// проверяется на голом массиве объектов, и это же держит его границу.

import { type Expr, defaultFormula, parseFormula } from "./formula.js";
import type { Condition, FilterState, PresenceCondition, Row, ValueCondition } from "./model.js";

/** Поле ЕСТЬ у строки — независимо от того, что в нём лежит. */
export function hasField(row: Row, field: string): boolean {
  return Object.hasOwn(row, field);
}

/**
 * Поле есть И заполнено.
 *
 * Пустым считаем `null`, `undefined`, пустую строку и строку из пробелов. Пустой массив —
 * тоже пусто: «телефонов нет» и «поля телефонов нет» пользователь читает одинаково, а вот
 * от «поля нет вовсе» это отличается, и различие видно в `exists`.
 */
export function isFilled(row: Row, field: string): boolean {
  if (!hasField(row, field)) return false;
  const value = row[field];
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function compareValue(actual: unknown, operator: ValueCondition["operator"], expected: string): boolean {
  if (actual === null || actual === undefined) return false;

  const actualText = String(actual);

  switch (operator) {
    case "eq":
      return actualText.toLowerCase() === expected.trim().toLowerCase();
    case "ne":
      return actualText.toLowerCase() !== expected.trim().toLowerCase();
    case "contains":
      return actualText.toLowerCase().includes(expected.trim().toLowerCase());
    case "gt":
    case "lt": {
      // Числа сравниваем числами, остальное — как текст. Смешение молча даёт «10 < 9».
      const actualNumber = Number(actual);
      const expectedNumber = Number(expected);
      const numeric = !Number.isNaN(actualNumber) && !Number.isNaN(expectedNumber) && expected.trim() !== "";
      if (numeric) {
        return operator === "gt" ? actualNumber > expectedNumber : actualNumber < expectedNumber;
      }
      return operator === "gt" ? actualText > expected : actualText < expected;
    }
  }
}

function matchPresence(row: Row, condition: PresenceCondition): boolean {
  const check = condition.mode === "exists" ? hasField : isFilled;
  const hits = condition.fields.filter((field) => check(row, field)).length;

  switch (condition.quantifier) {
    case "all":
      return condition.fields.length > 0 && hits === condition.fields.length;
    case "any":
      return hits > 0;
    case "none":
      return hits === 0;
  }
}

/** Проходит ли строка ОДНО условие. */
export function matchCondition(row: Row, condition: Condition): boolean {
  if (condition.kind === "presence") return matchPresence(row, condition);
  // Условие по значению у отсутствующего поля не выполняется — включая `не равно`: нельзя
  // сказать «не равно», когда сравнивать не с чем. Для «поля нет» есть отдельный вид условия.
  if (!hasField(row, condition.field)) return false;
  return compareValue(row[condition.field], condition.operator, condition.value);
}

function evaluate(expr: Expr, results: boolean[]): boolean {
  switch (expr.t) {
    case "ref":
      return results[expr.n - 1] ?? false;
    case "not":
      return !evaluate(expr.a, results);
    case "and":
      return evaluate(expr.a, results) && evaluate(expr.b, results);
    case "or":
      return evaluate(expr.a, results) || evaluate(expr.b, results);
  }
}

export type Compiled =
  | { ok: true; predicate: (row: Row) => boolean }
  | { ok: false; error: string };

/**
 * Собрать из состояния готовый предикат.
 *
 * Возвращает ошибку, а не бросает: неверная формула — обычное состояние ввода, а не сбой.
 */
export function compile(state: FilterState): Compiled {
  const conditions = state.conditions;

  if (conditions.length === 0) {
    return { ok: true, predicate: () => true };
  }

  const text = state.logic.mode === "all" ? defaultFormula(conditions.length) : state.logic.text;
  const parsed = parseFormula(text, conditions.length);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  const expr = parsed.expr;
  return {
    ok: true,
    predicate: (row: Row) => evaluate(expr, conditions.map((condition) => matchCondition(row, condition))),
  };
}

/** Отфильтровать строки. Неверная формула — строки возвращаются как есть, вместе с ошибкой. */
export function applyFilter(
  rows: readonly Row[],
  state: FilterState,
): { rows: Row[]; error: string | null } {
  const compiled = compile(state);
  if (!compiled.ok) return { rows: [...rows], error: compiled.error };
  return { rows: rows.filter(compiled.predicate), error: null };
}

/**
 * Сколько строк оставляет условие САМО ПО СЕБЕ.
 *
 * Именно само по себе, а не накопительно: при своей формуле «накопительный» счёт зависит от
 * порядка, которого в формуле нет, и число врало бы. Это тот счётчик, который отвечает на
 * вопрос «где сломалось» — самый частый при сборке фильтра.
 */
export function countMatching(rows: readonly Row[], condition: Condition): number {
  return rows.reduce((total, row) => (matchCondition(row, condition) ? total + 1 : total), 0);
}
