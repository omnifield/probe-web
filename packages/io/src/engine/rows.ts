// см. README.md / FAQ.md — L3: форма ЦЕЛИКОМ, включая повторы (поиск набора записей в чужом
// ответе). Одна запись внутри набора — предмет L2 (`field-rules.ts`), сюда не переносится.

import { collectFieldRuleReport, type ExtraPolicy, type FieldRule, type FieldRuleReport } from "./field-rules.js";
import { discoverPaths, lookup, pointerOf, type FieldRef } from "./paths.js";

/**
 * Найти в чужом ответе места, похожие на набор записей (первый элемент массива — объект).
 *
 * Не выбирает сам — только предлагает список путей-кандидатов: заворачивают все по-разному
 * (`/data/items`, `/result`, вовсе без обёртки), и путь до нужного набора выбирает человек,
 * настраивающий адаптер.
 */
export function discoverRowSets(input: unknown, depth = 4): FieldRef[] {
  const found: FieldRef[] = [];

  const walk = (value: unknown, path: string[], left: number): void => {
    if (left === 0) return;

    if (Array.isArray(value)) {
      const first = value[0];
      if (typeof first === "object" && first !== null && !Array.isArray(first)) found.push(pointerOf(path));
      return;
    }

    if (typeof value === "object" && value !== null) {
      for (const [key, inner] of Object.entries(value)) walk(inner, [...path, key], left - 1);
    }
  };

  walk(input, [], depth);
  return found;
}

/** Пути ВНУТРИ первой записи выбранного набора — то, из чего собираются `FieldRule` в L2. */
export function discoverRowPaths(input: unknown, rows: FieldRef, depth = 6): FieldRef[] {
  const found = lookup(input, rows);
  const set = found.found ? found.value : input;
  const first = Array.isArray(set) ? set[0] : set;
  return first === undefined ? [] : discoverPaths(first, depth);
}

export interface RowsResult {
  rows: Record<string, unknown>[];
  report: FieldRuleReport;
  /** Набор записей целиком не нашёлся — это не «ничего не легло», это «не туда смотрим». */
  error: string | null;
}

const EMPTY_REPORT: FieldRuleReport = { total: 0, converted: 0, rejected: 0, issues: [], unmapped: [] };

/**
 * L3: путь до набора записей (`rows`) + правила полей одной записи (`fields`, L2) → канон целиком.
 *
 * Тонкая обёртка вокруг `collectFieldRuleReport` — сама L2-работа здесь не повторяется, только
 * достаёт массив по пути перед тем, как передать его дальше.
 */
export function collectRowsReport(
  input: unknown,
  rows: FieldRef,
  fields: readonly FieldRule[],
  extra: ExtraPolicy = "drop",
): RowsResult {
  const found = lookup(input, rows);
  const set = rows === "" ? input : found.found ? found.value : undefined;

  if (!Array.isArray(set)) {
    return {
      rows: [],
      report: EMPTY_REPORT,
      error:
        rows === ""
          ? "в ответе ожидался массив записей, а пришло что-то другое"
          : `по пути «${rows}» набора записей нет`,
    };
  }

  const sources = set.filter((row): row is Record<string, unknown> => typeof row === "object" && row !== null);
  const { rows: converted, report } = collectFieldRuleReport(sources, fields, extra);
  return { rows: converted, report, error: null };
}
