// ГРАНИЦА МОДУЛЯ ТАБЛИЦЫ — единственная опубликованная поверхность.
//
// Таблица ЗНАЕТ про фильтры ровно одним способом: берёт у них словарь полей (`FieldSpec`).
// Обратной зависимости нет и быть не может — фильтры уедут отдельным продуктом, и знание про
// таблицу утащило бы за ними лишнее.
//
// `trace.js` наружу не выходит: замер — внутреннее дело модуля, а каждый экспорт замерзает.

export { DEFAULT_LOCALE, type Formatted, formatValue } from "./format.js";
export {
  type ColumnDictionary,
  type ColumnSpec,
  defaultFormat,
  EMPTY_VIEW,
  type FieldRef,
  type FieldSpec,
  type FieldType,
  FORMAT_LABELS,
  type FormatKind,
  type FormatOptions,
  formatOf,
  type Row,
  type SortDirection,
  type SortRule,
  VIEW_FORMAT_VERSION,
  type ViewState,
} from "./model.js";
export { compareValues } from "./sort.js";
export {
  type CellAttrs,
  type CellContext,
  ColumnControls,
  type ColumnControlsProps,
  DataTable,
  type DataTableProps,
} from "./table.jsx";
export {
  columnOrder,
  isVisible,
  moveColumn,
  type ParsedView,
  parseView,
  serializeView,
  sortDirectionOf,
  sortPositionOf,
  toggleColumn,
  toggleSort,
  visibleColumns,
} from "./view.js";
