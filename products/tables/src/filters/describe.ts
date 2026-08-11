// Прочтение фильтра словами.
//
// Это не украшение, а проверка: собранный фильтр обязан читаться предложением. Если фраза
// не читается — интерфейс врёт о том, что построено, и пользователь узнает об этом по
// пустому результату, а не по экрану.

import type { FieldRef } from "./field.js";
import { type Expr, defaultExpr } from "./formula.js";
import {
  COMPARISON_OPERATOR_LABELS,
  type Condition,
  type FieldDictionary,
  type FilterState,
  QUANTIFIER_LABELS,
} from "./model.js";

/** Как называется поле в интерфейсе; неизвестное показываем как есть. */
export type FieldLabels = Readonly<Record<FieldRef, string>>;

/** Собрать подписи из словаря полей. */
export function labelsOf(fields: FieldDictionary): FieldLabels {
  return Object.fromEntries(fields.map((field) => [field.name, field.label]));
}

function fieldLabel(field: FieldRef, labels: FieldLabels): string {
  return labels[field] ?? field;
}

function quoted(field: FieldRef, labels: FieldLabels): string {
  return `«${fieldLabel(field, labels)}»`;
}

/** Одно условие словами. */
export function describeCondition(condition: Condition, labels: FieldLabels = {}): string {
  switch (condition.kind) {
    case "compare": {
      const value = condition.value.trim();
      const operator = COMPARISON_OPERATOR_LABELS[condition.operator];
      const care = condition.sensitive === true ? ", с учётом регистра" : "";
      return `${quoted(condition.field, labels)} ${operator} «${value}»${care}`;
    }
    case "in": {
      if (condition.values.length === 0) {
        return `${quoted(condition.field, labels)}: список значений пуст`;
      }
      const values = condition.values.map((value) => `«${value.trim()}»`).join(", ");
      return `${quoted(condition.field, labels)} — одно из: ${values}`;
    }
    case "between": {
      const from = condition.from.trim();
      const to = condition.to.trim();
      if (from === "" || to === "") {
        return `${quoted(condition.field, labels)}: границы диапазона не заданы`;
      }
      return `${quoted(condition.field, labels)} от «${from}» до «${to}» включительно`;
    }
    case "presence": {
      const verb = condition.mode === "exists" ? "есть" : "заполнено";
      if (condition.fields.length === 0) return `${verb}: поля не выбраны`;
      const names = condition.fields.map((field) => quoted(field, labels)).join(", ");
      return `${verb} ${QUANTIFIER_LABELS[condition.quantifier]}: ${names}`;
    }
  }
}

const PRIORITY = { or: 1, and: 2, not: 3 } as const;

function describeExpr(expr: Expr, parts: ReadonlyMap<string, string>, parentPriority: number): string {
  switch (expr.t) {
    case "ref":
      // Ссылка на удалённое условие произносится вслух: молчать здесь — значит показать
      // фразу, которая не соответствует тому, что будет посчитано.
      return parts.get(expr.id) ?? "условие, которого больше нет";
    case "not":
      return `не (${describeExpr(expr.a, parts, PRIORITY.not)})`;
    case "and": {
      const text = `${describeExpr(expr.a, parts, PRIORITY.and)} и ${describeExpr(expr.b, parts, PRIORITY.and)}`;
      return parentPriority > PRIORITY.and ? `(${text})` : text;
    }
    case "or": {
      const text = `${describeExpr(expr.a, parts, PRIORITY.or)} или ${describeExpr(expr.b, parts, PRIORITY.or)}`;
      return parentPriority > PRIORITY.or ? `(${text})` : text;
    }
  }
}

/** Весь фильтр одной фразой. */
export function describeFilter(state: FilterState, labels: FieldLabels = {}): string {
  if (state.conditions.length === 0) return "Показаны все строки — условий нет.";

  const ids = state.conditions.map((condition) => condition.id);
  const expr = state.logic.mode === "all" ? defaultExpr(ids) : state.logic.expr;
  if (expr === null) return "Показаны все строки — условий нет.";

  const parts = new Map(
    state.conditions.map((condition) => [condition.id, describeCondition(condition, labels)]),
  );

  return `Показать строки, где ${describeExpr(expr, parts, 0)}.`;
}
