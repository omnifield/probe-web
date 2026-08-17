// ГРАНИЦА МОДУЛЯ ФИЛЬТРОВ — единственная опубликованная поверхность.
//
// Фильтры уедут отдельным продуктом (план user 2026-08-10), поэтому граница объявляется
// сейчас, а не потом: всё, что снаружи, ходит СЮДА и никогда — в `./model.js`, `./evaluate.js`
// и прочие внутренности. Тогда выезд позже будет переносом папки, а не переписыванием.
//
// Обратная сторона границы тоже держится: модуль НЕ знает про таблицу. Здесь нет ни одного
// импорта из `../table` и быть не может — фильтры работают с голым массивом объектов.
//
// `trace.js` наружу НЕ выходит: замер — внутреннее дело модуля, а каждый экспорт замерзает.

export {
  applyFilter,
  compile,
  type Compiled,
  countMatching,
  type EvaluateOptions,
  hasField,
  isFilled,
  matchCondition,
} from "./evaluate.js";
export { describeCondition, describeFilter, type FieldLabels, labelsOf } from "./describe.js";
export {
  type FieldRef,
  isFieldRef,
  lookup,
  type Lookup,
  type Row,
  toFieldRef,
} from "./field.js";
export {
  danglingIds,
  defaultExpr,
  defaultFormula,
  type Expr,
  formatFormula,
  negatedIds,
  parseFormula,
  type ParseResult,
  referencedIds,
  remapIds,
} from "./formula.js";
export {
  COMPARISON_OPERATOR_LABELS,
  type ComparisonCondition,
  type ComparisonOperator,
  type Condition,
  CONDITION_KIND_LABELS,
  type ConditionKind,
  EMPTY_FILTER,
  type FieldDictionary,
  type FieldSpec,
  type FieldType,
  FILTER_FORMAT_VERSION,
  type FilterState,
  isIncomplete,
  type Logic,
  type MemberCondition,
  nextConditionId,
  operatorsFor,
  PRESENCE_MODE_LABELS,
  type PresenceCondition,
  type PresenceMode,
  QUANTIFIER_LABELS,
  type Quantifier,
  type RangeCondition,
  reserveConditionIds,
  supportsRange,
} from "./model.js";
export {
  applyPreset,
  applyTemplate,
  type Preset,
  type Template,
  type TemplateParam,
} from "./presets.js";
export { parseFilter, type ParsedFilter, serializeFilter } from "./serialize.js";
export {
  filterToSql,
  type SqlDialect,
  type SqlOptions,
  type SqlQuery,
  sqlColumn,
} from "./sql.js";
export {
  checkPresetInput,
  createMemoryPresetStore,
  PRESET_LIMITS,
  type PresetInfo,
  type PresetInput,
  type PresetStore,
  type StoredPreset,
} from "./store.js";
export { and, not, or, passes, type Truth, UNKNOWN } from "./truth.js";
export { FilterBuilder, type FilterBuilderProps } from "./ui/filter-builder.jsx";
