// Пресеты и шаблоны — ДАННЫЕ, а не код.
//
// Из этого следует всё, ради чего они заводились: их можно хранить, привезти с бэка, дать
// пользователю сохранить свой. Будь шаблон функцией, он остался бы кодом и никуда бы не уехал.
//
// В интерфейсе они РАЗВЕДЕНЫ намеренно: пресет применяется одной кнопкой и ничего не
// спрашивает, шаблон сначала спрашивает значения. Смешаешь — пользователь не понимает,
// спросят его или нет.

import { remapIds } from "./formula.js";
import {
  type Condition,
  FILTER_FORMAT_VERSION,
  type FilterState,
  type Logic,
  nextConditionId,
} from "./model.js";

/** Готовая сборка: применяется как есть. */
export interface Preset {
  id: string;
  label: string;
  hint?: string;
  state: FilterState;
}

/** Дырка в шаблоне: что спросить у пользователя. */
export interface TemplateParam {
  key: string;
  label: string;
  /** `text` — одна строка; `fields` — выбор нескольких полей. */
  kind: "text" | "fields";
}

/**
 * Заготовка с дырками. Дырка записывается как `{{ключ}}` — в значении условия или вместо
 * имени поля. Подстановка живёт в `applyTemplate`.
 */
export interface Template {
  id: string;
  label: string;
  hint?: string;
  params: TemplateParam[];
  state: FilterState;
}

const HOLE = /^\{\{(.+)\}\}$/;

function fillText(value: string, values: Record<string, string | string[]>): string {
  const hole = HOLE.exec(value);
  if (!hole) return value;
  const filled = values[hole[1]!];
  if (filled === undefined) return "";
  return Array.isArray(filled) ? (filled[0] ?? "") : filled;
}

function fillList(values: readonly string[], filled: Record<string, string | string[]>): string[] {
  return values.flatMap((value) => {
    const hole = HOLE.exec(value);
    if (!hole) return [value];
    const chosen = filled[hole[1]!];
    if (chosen === undefined) return [];
    return Array.isArray(chosen) ? chosen : [chosen];
  });
}

/**
 * Выдать условиям новые идентификаторы И переписать под них логику.
 *
 * Второе — не деталь: логика ссылается на условия по `id`, и клон, у которого условия
 * получили новые имена, а формула осталась со старыми, ссылался бы в пустоту. Раньше формула
 * держала номера, и эта поломка была невидима — до тех пор, пока не начала бы врать.
 */
function reissue(conditions: readonly Condition[], logic: Logic): FilterState {
  const mapping = new Map<string, string>();

  const next = conditions.map((condition) => {
    const id = nextConditionId();
    mapping.set(condition.id, id);
    return { ...condition, id };
  });

  return {
    version: FILTER_FORMAT_VERSION,
    conditions: next,
    logic: logic.mode === "formula" ? { mode: "formula", expr: remapIds(logic.expr, mapping) } : logic,
  };
}

/** Подставить значения в шаблон. Идентификаторы условий выдаются заново — это новая сборка. */
export function applyTemplate(
  template: Template,
  values: Record<string, string | string[]>,
): FilterState {
  const filled: Condition[] = template.state.conditions.map((condition) => {
    switch (condition.kind) {
      case "compare":
        return { ...condition, value: fillText(condition.value, values) };
      case "in":
        return { ...condition, values: fillList(condition.values, values) };
      case "between":
        return {
          ...condition,
          from: fillText(condition.from, values),
          to: fillText(condition.to, values),
        };
      case "presence":
        return { ...condition, fields: fillList(condition.fields, values) };
    }
  });

  return reissue(filled, template.state.logic);
}

/** Клон пресета — с новыми идентификаторами, чтобы правки не били по самому пресету. */
export function applyPreset(preset: Preset): FilterState {
  return reissue(preset.state.conditions, preset.state.logic);
}
