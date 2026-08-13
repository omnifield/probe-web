// ГРАНИЦА МОДУЛЯ ТАБЛИЦЫ — единственная опубликованная поверхность.
//
// Таблица ЗНАЕТ про фильтры ровно одним способом: берёт у них словарь полей (`FieldSpec`).
// Обратной зависимости нет и быть не может — фильтры уедут отдельным продуктом, и знание про
// таблицу утащило бы за ними лишнее.
//
// `trace.js` наружу не выходит: замер — внутреннее дело модуля, а каждый экспорт замерзает.

// Показ значения и сведение — общая середина зоны (`src/dataset`), а не принадлежность
// таблицы: график берёт их же. Здесь они перевыставлены, чтобы потребителю таблицы не
// приходилось знать про две двери сразу.
export {
  aggregate,
  type Aggregated,
  DEFAULT_LOCALE,
  type Formatted,
  formatValue,
} from "../dataset/index.js";
export {
  AGGREGATE_LABELS,
  type AggregateKind,
  type ColumnDictionary,
  type ColumnSpec,
  defaultFormat,
  EMPTY_SESSION,
  EMPTY_VIEW,
  type FieldRef,
  type FieldSpec,
  type FieldType,
  FORMAT_LABELS,
  type FormatKind,
  type FormatOptions,
  formatOf,
  groupableBy,
  type PinnedEdges,
  type Row,
  type SessionState,
  type SortDirection,
  type SortRule,
  VIEW_FORMAT_VERSION,
  type ViewState,
} from "./model.js";
export {
  clampPage,
  expandAll,
  goToPage,
  isExpanded,
  isSelected,
  pageCount,
  pinnedRowEdge,
  pinRow,
  setSelected,
  toggleExpanded,
  toggleSelected,
} from "./session.js";
export { compareValues } from "./sort.js";
export { type ViewSql, type ViewSqlOptions, viewToSql } from "./sql.js";
export {
  type CellAttrs,
  type CellContext,
  DataTable,
  type DataTableProps,
  GroupControls,
  type GroupControlsProps,
  HiddenColumns,
  type HiddenColumnsProps,
  TablePager,
  type TablePagerProps,
} from "./table.jsx";
export {
  canMoveColumn,
  COLUMN_WIDTH_STEP,
  columnOrder,
  groupableColumns,
  isVisible,
  MIN_COLUMN_WIDTH,
  moveColumn,
  type ParsedView,
  parseView,
  pinColumn,
  pinnedEdgeOf,
  serializeView,
  setColumnWidth,
  setPageSize,
  sortDirectionOf,
  sortPositionOf,
  toggleColumn,
  toggleGrouping,
  toggleSort,
  visibleColumns,
} from "./view.js";
