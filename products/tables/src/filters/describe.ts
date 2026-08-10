// Прочтение фильтра словами.
//
// Это не украшение, а проверка: собранный фильтр обязан читаться предложением. Если фраза
// не читается — интерфейс врёт о том, что построено, и пользователь узнает об этом по
// пустому результату, а не по экрану.

import { type Expr, defaultFormula, parseFormula } from "./formula.js";
import {
  type Condition,
  type FilterState,
  QUANTIFIER_LABELS,
  VALUE_OPERATOR_LABELS,
} from "./model.js";

/** Как называется поле в интерфейсе; неизвестное показываем как есть. */
export type FieldLabels = Readonly<Record<string, string>>;

function fieldLabel(field: string, labels: FieldLabels): string {
  return labels[field] ?? field;
}

/** Одно условие словами. */
export function describeCondition(condition: Condition, labels: FieldLabels = {}): string {
  if (condition.kind === "value") {
    const value = condition.value.trim();
    return `«${fieldLabel(condition.field, labels)}» ${VALUE_OPERATOR_LABELS[condition.operator]} «${value}»`;
  }

  const verb = condition.mode === "exists" ? "есть" : "заполнено";
  const names = condition.fields.map((field) => `«${fieldLabel(field, labels)}»`).join(", ");
  if (condition.fields.length === 0) return `${verb}: поля не выбраны`;
  return `${verb} ${QUANTIFIER_LABELS[condition.quantifier]}: ${names}`;
}

function describeExpr(expr: Expr, parts: string[], parentPriority: number): string {
  switch (expr.t) {
    case "ref":
      return parts[expr.n - 1] ?? `условие №${expr.n}`;
    case "not":
      return `не (${describeExpr(expr.a, parts, 3)})`;
    case "and": {
      const text = `${describeExpr(expr.a, parts, 2)} и ${describeExpr(expr.b, parts, 2)}`;
      return parentPriority > 2 ? `(${text})` : text;
    }
    case "or": {
      const text = `${describeExpr(expr.a, parts, 1)} или ${describeExpr(expr.b, parts, 1)}`;
      return parentPriority > 1 ? `(${text})` : text;
    }
  }
}

/** Весь фильтр одной фразой. Неверная формула — говорим об этом, а не молчим. */
export function describeFilter(state: FilterState, labels: FieldLabels = {}): string {
  if (state.conditions.length === 0) return "Показаны все строки — условий нет.";

  const text = state.logic.mode === "all" ? defaultFormula(state.conditions.length) : state.logic.text;
  const parsed = parseFormula(text, state.conditions.length);
  if (!parsed.ok) return `Формулу не разобрать: ${parsed.error}.`;

  const parts = state.conditions.map((condition) => describeCondition(condition, labels));
  return `Показать строки, где ${describeExpr(parsed.expr, parts, 0)}.`;
}
