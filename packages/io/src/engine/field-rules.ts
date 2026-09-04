// см. README.md / FAQ.md — L2: правила полей ОДНОЙ записи (набор записей — предмет L3).

import { z } from "zod";

import { assign, discoverPaths, lookup, type FieldRef } from "./paths.js";
import { isBlank, runSteps, type Step } from "./steps.js";

/** Что делать, когда поле не собралось — свой выбор на каждое поле, не один режим на всё. */
export type OnFail = "skip" | "default" | "reject";

export interface FieldRule {
  /** Куда кладём — путь в РЕЗУЛЬТАТЕ. */
  target: FieldRef;
  /** Откуда берём — путь в ИСХОДНОЙ записи. Не нужен, когда первый шаг сам добывает значение (`constant`). */
  from?: FieldRef;
  steps?: Step[];
  /** По умолчанию — `skip`: поля просто не будет, и это честнее подстановки. */
  onFail?: OnFail;
  /** Значение для `default`. */
  fallback?: string;
}

/** Их поля, для которых правил нет. `drop` (по умолчанию) — не тащим; `keep` — проносим как есть. */
export type ExtraPolicy = "drop" | "keep";

/** Одна беда, случившаяся при разборе МНОЖЕСТВА записей: где, что и на скольких. */
export interface FieldRuleIssue {
  target: FieldRef;
  reason: string;
  count: number;
  /** Несколько примеров — по ним человек узнаёт свои данные. */
  examples: string[];
}

export interface FieldRuleReport {
  total: number;
  converted: number;
  rejected: number;
  issues: FieldRuleIssue[];
  /** Их поля, которые никуда не легли: путь и на скольких записях оно заполнено. */
  unmapped: Array<{ path: FieldRef; count: number }>;
}

const MAX_EXAMPLES = 3;

function usedPaths(fields: readonly FieldRule[]): Set<FieldRef> {
  const used = new Set<FieldRef>();
  for (const rule of fields) {
    if (rule.from !== undefined) used.add(rule.from);
    for (const step of rule.steps ?? []) {
      if (step.kind === "coalesce") for (const path of step.from) used.add(path);
      if (step.kind === "concat") {
        for (const part of step.parts) if (part.from !== undefined) used.add(part.from);
      }
    }
  }
  return used;
}

/** Собрать ОДНУ запись по правилам. `null` — запись забракована правилом `reject`. */
export function convertRecord(
  source: Record<string, unknown>,
  fields: readonly FieldRule[],
  note: (rule: FieldRule, reason: string, value: unknown) => void,
  extra: ExtraPolicy = "drop",
): Record<string, unknown> | null {
  let row: Record<string, unknown> = extra === "keep" ? { ...source } : {};

  for (const rule of fields) {
    const start = rule.from === undefined ? undefined : lookup(source, rule.from).value;
    const result = runSteps(rule.steps ?? [], start, source);

    if (!result.ok || isBlank(result.value)) {
      const reason = result.ok ? "значение пустое" : result.reason;
      const failure = rule.onFail ?? "skip";

      if (failure === "reject") {
        note(rule, reason, start);
        return null;
      }

      if (failure === "default" && rule.fallback !== undefined) {
        row = assign(row, rule.target, rule.fallback);
        continue;
      }

      note(rule, reason, start);
      continue;
    }

    row = assign(row, rule.target, result.value);
  }

  return row;
}

/** Одна беда при разборе ОДНОЙ записи — без агрегации count/examples (та — предмет `collectFieldRuleReport`). */
export interface RecordIssue {
  rule: FieldRule;
  reason: string;
  value: unknown;
}

/** Применить правила к ОДНОЙ записи. */
export function applyFieldRules(
  source: Record<string, unknown>,
  fields: readonly FieldRule[],
  extra: ExtraPolicy = "drop",
): { row: Record<string, unknown> | null; issues: RecordIssue[] } {
  const issues: RecordIssue[] = [];
  const row = convertRecord(source, fields, (rule, reason, value) => issues.push({ rule, reason, value }), extra);
  return { row, issues };
}

/**
 * Отчёт по МНОЖЕСТВУ записей — та же семантика, что была у `AdapterReport` таблиц: ничего не
 * выбрасываем молча, а считаем и показываем («из 1000 записей 37 не легли, вот примеры»).
 */
export function collectFieldRuleReport(
  sources: readonly Record<string, unknown>[],
  fields: readonly FieldRule[],
  extra: ExtraPolicy = "drop",
): { rows: Record<string, unknown>[]; report: FieldRuleReport } {
  const issues = new Map<string, FieldRuleIssue>();
  const note = (rule: FieldRule, reason: string, value: unknown): void => {
    const key = `${rule.target}|${reason}`;
    const issue = issues.get(key) ?? { target: rule.target, reason, count: 0, examples: [] };
    issue.count += 1;
    if (issue.examples.length < MAX_EXAMPLES && !isBlank(value)) issue.examples.push(String(value));
    issues.set(key, issue);
  };

  const rows: Record<string, unknown>[] = [];
  let rejected = 0;
  for (const source of sources) {
    const row = convertRecord(source, fields, note, extra);
    if (row === null) rejected += 1;
    else rows.push(row);
  }

  const used = usedPaths(fields);
  const isBranch = (value: unknown): boolean => typeof value === "object" && value !== null && !Array.isArray(value);

  const unmapped =
    sources.length === 0
      ? []
      : discoverPaths(sources[0])
          .filter((path) => !used.has(path))
          .filter((path) => ![...used].some((one) => one.startsWith(`${path}/`)))
          .filter((path) => !isBranch(lookup(sources[0]!, path).value))
          .map((path) => ({ path, count: sources.filter((row) => !isBlank(lookup(row, path).value)).length }))
          .filter((entry) => entry.count > 0);

  return {
    rows,
    report: {
      total: sources.length,
      converted: rows.length,
      rejected,
      issues: [...issues.values()].sort((a, b) => b.count - a.count),
      unmapped,
    },
  };
}

/** L2 как `codec`: decode собирает канон по правилам, бракованная запись — явный throw. encode не реализован (см. FAQ.md). */
export function fieldRulesCodec<A extends z.ZodType, B extends z.ZodType>(
  input: A,
  output: B,
  fields: readonly FieldRule[],
  extra: ExtraPolicy = "drop",
): z.ZodCodec<A, B> {
  return z.codec(input, output, {
    decode: (theirs) => {
      const { row, issues } = applyFieldRules(theirs as Record<string, unknown>, fields, extra);
      if (row === null) {
        const [first] = issues;
        throw new Error(
          `запись забракована правилом «${first?.rule.target ?? "?"}»: ${first?.reason ?? "причина не названа"}`,
        );
      }
      return row as z.input<B>;
    },
    encode: () => {
      throw new Error("fieldRulesCodec: encode не реализован — L2 сегодня однонаправленный (decode)");
    },
  });
}
