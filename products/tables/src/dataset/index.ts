// Общая середина зоны — то, что таблица и график берут ОДИНАКОВО.
//
// Модуль намеренно маленький и без Solid: показ значения и сведение значений это про данные,
// а не про разметку. Растёт он только по надобности; каноническая форма входа (адаптеры,
// `tasker:TABLES-3`) — следующий и объявленный шаг, а не тихое расползание.

export { aggregate, type Aggregated, type AggregatableField } from "./aggregate.js";
export { DEFAULT_LOCALE, type Formatted, formatValue } from "./format.js";
export {
  AGGREGATE_LABELS,
  type AggregateKind,
  defaultFormat,
  type FieldRef,
  type FieldSpec,
  type FieldType,
  FORMAT_LABELS,
  type FormatKind,
  type FormatOptions,
  formatOf,
  type Presentable,
  type Row,
} from "./spec.js";
