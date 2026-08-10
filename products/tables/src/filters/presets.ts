// Пресеты и шаблоны — ДАННЫЕ, а не код.
//
// Из этого следует всё, ради чего они заводились: их можно хранить, привезти с бэка, дать
// пользователю сохранить свой. Будь шаблон функцией, он остался бы кодом и никуда бы не уехал.
//
// В интерфейсе они РАЗВЕДЕНЫ намеренно: пресет применяется одной кнопкой и ничего не
// спрашивает, шаблон сначала спрашивает значения. Смешаешь — пользователь не понимает,
// спросят его или нет.

import { type Condition, type FilterState, nextConditionId } from "./model.js";

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

function fillFields(fields: string[], values: Record<string, string | string[]>): string[] {
  return fields.flatMap((field) => {
    const hole = HOLE.exec(field);
    if (!hole) return [field];
    const filled = values[hole[1]!];
    if (filled === undefined) return [];
    return Array.isArray(filled) ? filled : [filled];
  });
}

/** Подставить значения в шаблон. Идентификаторы условий выдаются заново — это новая сборка. */
export function applyTemplate(
  template: Template,
  values: Record<string, string | string[]>,
): FilterState {
  const conditions: Condition[] = template.state.conditions.map((condition) =>
    condition.kind === "value"
      ? { ...condition, id: nextConditionId(), value: fillText(condition.value, values) }
      : { ...condition, id: nextConditionId(), fields: fillFields(condition.fields, values) },
  );

  return { conditions, logic: template.state.logic };
}

/** Клон пресета — с новыми идентификаторами, чтобы правки не били по самому пресету. */
export function applyPreset(preset: Preset): FilterState {
  return {
    conditions: preset.state.conditions.map((condition) => ({ ...condition, id: nextConditionId() })),
    logic: preset.state.logic,
  };
}
