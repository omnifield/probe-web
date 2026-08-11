// Итоги по колонке.
//
// Имена методов взяты у OData Data Aggregation (Committee Specification 04) — единственного
// свода, который их нормирует: `sum`, `min`, `max`, `average`, `countdistinct` и особый счёт
// членов `$count`. Придумывать свои названия там, где норма есть, — ровно то, чего сверка
// велит не делать (`tasker:TABLES-6`).
//
// ЧТО СЧИТАЕТСЯ ПО КАКОМУ НАБОРУ. Итог берётся по всем строкам, которые таблице подали, —
// то есть ПОСЛЕ отбора и ДО листания. Это же правило нормировано у OData для `/$count`
// («считается после `$filter`, до страницы»), и оно единственно осмысленное: итог по одной
// странице — не итог, а сумма того, что попалось на глаза.

import { lookup, type Row } from "../filters/index.js";
import type { AggregateKind, ColumnSpec } from "./model.js";

/** Итог: чем считали и что вышло. `null` — считать было нечего. */
export interface Aggregated {
  kind: AggregateKind;
  value: number | null;
  /** Счётчики показываются как обычные числа, а не форматом колонки. */
  counting: boolean;
}

function numeric(value: unknown, column: ColumnSpec): number | null {
  if (value === null || value === undefined) return null;

  if (column.type === "date") {
    const time = value instanceof Date ? value.getTime() : Date.parse(String(value));
    return Number.isNaN(time) ? null : time;
  }

  if (typeof value === "number") return Number.isNaN(value) ? null : value;
  if (typeof value !== "string" || value.trim() === "") return null;

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Посчитать итог колонки по набору строк.
 *
 * `count` считает ЧЛЕНОВ НАБОРА, как `$count` у OData, — то есть одинаков для всех колонок и
 * отвечает на «сколько тут строк». Остальные методы работают по непустым и разбираемым
 * значениям; если таких нет, итога нет — и это `null`, а не ноль. Ноль здесь соврал бы:
 * «сумма нулевая» и «складывать было нечего» — разные вещи.
 */
export function aggregate(
  rows: readonly Row[],
  column: ColumnSpec,
  kind: AggregateKind = column.aggregate ?? "count",
): Aggregated {
  if (kind === "count") {
    return { kind, value: rows.length, counting: true };
  }

  const values = rows
    .map((row) => lookup(row, column.name))
    .filter((found) => found.found)
    .map((found) => found.value)
    .filter((value) => value !== null && value !== undefined && String(value).trim() !== "");

  if (kind === "countdistinct") {
    return { kind, value: new Set(values.map((value) => String(value))).size, counting: true };
  }

  const numbers = values
    .map((value) => numeric(value, column))
    .filter((value): value is number => value !== null);

  if (numbers.length === 0) return { kind, value: null, counting: false };

  switch (kind) {
    case "sum":
      return { kind, value: numbers.reduce((total, value) => total + value, 0), counting: false };
    case "min":
      return { kind, value: Math.min(...numbers), counting: false };
    case "max":
      return { kind, value: Math.max(...numbers), counting: false };
    case "average":
      return {
        kind,
        value: numbers.reduce((total, value) => total + value, 0) / numbers.length,
        counting: false,
      };
  }
}
