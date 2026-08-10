// ГРАНИЦА МОДУЛЯ ФИЛЬТРОВ — единственная опубликованная поверхность.
//
// Фильтры уедут отдельным продуктом (план user 2026-08-10), поэтому граница объявляется
// сейчас, а не потом: всё, что снаружи, ходит СЮДА и никогда — в `./model.js`, `./evaluate.js`
// и прочие внутренности. Тогда выезд позже будет переносом папки, а не переписыванием.
//
// Обратная сторона границы тоже держится: модуль НЕ знает про таблицу. Здесь нет ни одного
// импорта из `../table` и быть не может — фильтры работают с голым массивом объектов.

export { applyFilter, compile, countMatching, hasField, isFilled, matchCondition } from "./evaluate.js";
export { describeCondition, describeFilter, type FieldLabels } from "./describe.js";
export { defaultFormula, type Expr, parseFormula, type ParseResult } from "./formula.js";
export {
  type Condition,
  EMPTY_FILTER,
  type FilterState,
  type Logic,
  nextConditionId,
  PRESENCE_MODE_LABELS,
  type PresenceCondition,
  type PresenceMode,
  QUANTIFIER_LABELS,
  type Quantifier,
  type Row,
  VALUE_OPERATOR_LABELS,
  type ValueCondition,
  type ValueOperator,
} from "./model.js";
export {
  applyPreset,
  applyTemplate,
  type Preset,
  type Template,
  type TemplateParam,
} from "./presets.js";
export { type FieldOption, FilterBuilder, type FilterBuilderProps } from "./ui/filter-builder.jsx";
