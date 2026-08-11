// Применение адаптера: чужой ответ → наш канон плюс ОТЧЁТ о том, что не легло.
//
// Отчёт здесь не украшение и не отладка. Рынок на вопрос «что делать с несопоставимым»
// отвечает тремя разными способами (молча отбросить · подставить умолчание · ошибка), и
// общей нормы нет. Наш ответ четвёртый и следует из того, что адаптер настраивает ЧЕЛОВЕК в
// конструкторе: ничего не выбрасываем молча, а считаем и показываем — «из 1000 строк 37 не
// легли, вот примеры». Тот же приём, что и счётчик у условия фильтра: ошибку настройки видно
// сразу, а не через месяц по пропавшим данным.

import type { FieldRef, Row } from "../dataset/index.js";
import type { AdapterSpec, FieldRule } from "./model.js";
import { assign, discoverPaths, lookup } from "./paths.js";
import { isBlank, runSteps } from "./steps.js";
import { trace } from "./trace.js";

/** Одна беда, случившаяся при разборе: где, что и на скольких строках. */
export interface AdapterIssue {
  target: FieldRef;
  reason: string;
  count: number;
  /** Несколько примеров — по ним человек узнаёт свои данные. */
  examples: string[];
}

export interface AdapterReport {
  /** Строк во входе. */
  total: number;
  /** Строк, доехавших до канона. */
  converted: number;
  /** Строк, забракованных правилом `reject`. */
  rejected: number;
  issues: AdapterIssue[];
  /** Их поля, которые никуда не легли: путь и на скольких строках оно заполнено. */
  unmapped: Array<{ path: FieldRef; count: number }>;
}

export interface Adapted {
  rows: Row[];
  report: AdapterReport;
  /** Ошибка целиком: набор строк не нашёлся. Это не «ничего не легло», это «не туда смотрим». */
  error: string | null;
}

const MAX_EXAMPLES = 3;

const EMPTY_REPORT: AdapterReport = {
  total: 0,
  converted: 0,
  rejected: 0,
  issues: [],
  unmapped: [],
};

function usedPaths(spec: AdapterSpec): Set<FieldRef> {
  const used = new Set<FieldRef>();

  for (const rule of spec.fields) {
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

/** Собрать одну нашу строку. `null` — строка забракована правилом. */
function convert(
  source: Row,
  spec: AdapterSpec,
  note: (rule: FieldRule, reason: string, value: unknown) => void,
): Row | null {
  // `keep` — проносим чужое как есть; `drop` (по умолчанию) — начинаем с чистого листа, и
  // канон остаётся каноном: чужая форма в него не просачивается сама собой.
  let row: Row = (spec.extra ?? "drop") === "keep" ? { ...source } : {};

  for (const rule of spec.fields) {
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

      // `skip`: поля просто не будет. У нас это ЗНАЧИМОЕ состояние — «поля нет» отличается от
      // «поле пустое» и в фильтре, и в таблице, и в графике.
      note(rule, reason, start);
      continue;
    }

    row = assign(row, rule.target, result.value);
  }

  return row;
}

/** Применить адаптер к их ответу. */
export function applyAdapter(input: unknown, spec: AdapterSpec): Adapted {
  const done = trace("applyAdapter");

  const found = lookup(input as Row, spec.rows);
  const set = spec.rows === "" ? input : found.found ? found.value : undefined;

  if (!Array.isArray(set)) {
    done("набор строк не найден");
    return {
      rows: [],
      report: EMPTY_REPORT,
      error:
        spec.rows === ""
          ? "в ответе ожидался массив строк, а пришло что-то другое"
          : `по пути «${spec.rows}» набора строк нет`,
    };
  }

  const sources = set.filter((row): row is Row => typeof row === "object" && row !== null);
  const issues = new Map<string, AdapterIssue>();

  const note = (rule: FieldRule, reason: string, value: unknown): void => {
    const key = `${rule.target}|${reason}`;
    const issue = issues.get(key) ?? { target: rule.target, reason, count: 0, examples: [] };
    issue.count += 1;
    if (issue.examples.length < MAX_EXAMPLES && !isBlank(value)) issue.examples.push(String(value));
    issues.set(key, issue);
  };

  const rows: Row[] = [];
  let rejected = 0;

  for (const source of sources) {
    const row = convert(source, spec, note);
    if (row === null) rejected += 1;
    else rows.push(row);
  }

  // Их поля, которые никуда не легли. Считаем по первой строке — состав набора однороден, а
  // перебирать все ради списка путей значило бы платить за отчёт больше, чем за работу.
  const used = usedPaths(spec);
  const isBranch = (value: unknown): boolean =>
    typeof value === "object" && value !== null && !Array.isArray(value);

  const unmapped =
    sources.length === 0
      ? []
      : discoverPaths(sources[0])
          .filter((path) => !used.has(path))
          // Промежуточные узлы не считаем забытыми: если использованы `/client/last` и
          // `/client/first`, то `/client` в списке — шум, из-за которого настоящую пропажу
          // не заметят.
          .filter((path) => ![...used].some((one) => one.startsWith(`${path}/`)))
          .filter((path) => !isBranch(lookup(sources[0]!, path).value))
          .map((path) => ({
            path,
            count: sources.filter((row) => !isBlank(lookup(row, path).value)).length,
          }))
          .filter((entry) => entry.count > 0);

  done(`${sources.length} → ${rows.length}`);

  return {
    rows,
    report: {
      total: sources.length,
      converted: rows.length,
      rejected,
      issues: [...issues.values()].sort((a, b) => b.count - a.count),
      unmapped,
    },
    error: null,
  };
}
