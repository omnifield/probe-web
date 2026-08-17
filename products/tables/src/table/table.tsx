// Таблица — БЕЗГОЛОВАЯ, как и кит, на котором стоит (`kb:PROBEWEB-4`).
//
// Начинка чужая и проверенная, контракт наш (`kb:WEBER-16`): порядок и видимость колонок,
// закрепление, ширины, группировка, раскрытие, сортировка, листание и выделение строк взяты
// у TanStack v9 — возможности подключаются поштучно. Проверено на установленном пакете 9.1.2.
//
// ФИЛЬТРАЦИЮ TanStack мы НЕ подключаем сознательно: фильтры у нас свои и это отдельный
// продукт. Две фильтрации в одной таблице разъехались бы на первой правке.
//
// Состояние снаружи и РАЗВЕДЕНО НАДВОЕ: вид (сохраняется, версионируется) и сеанс (страница,
// раскрытые группы, выделение, закреплённые строки — живёт до перезагрузки). Разбор — в
// `model.ts`; коротко: вид переживает строки, сеанс — нет.

import {
  aggregationFn_count,
  aggregationFn_max,
  aggregationFn_mean,
  aggregationFn_min,
  aggregationFn_sum,
  aggregationFn_uniqueCount,
  columnGroupingFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createCoreRowModel,
  createExpandedRowModel,
  createGroupedRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  createTable,
  rowAggregationFeature,
  rowExpandingFeature,
  rowPaginationFeature,
  rowPinningFeature,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
} from "@tanstack/solid-table";
import { createEffect, createMemo, createSignal, For, on, Show } from "solid-js";

import { lookup } from "../filters/index.js";
import { aggregate, DEFAULT_LOCALE, formatValue } from "../dataset/index.js";
import {
  type AggregateKind,
  type ColumnDictionary,
  type ColumnSpec,
  EMPTY_SESSION,
  formatOf,
  groupableBy,
  type Row,
  type SessionState,
  type ViewState,
} from "./model.js";
import {
  clampPage,
  expandAll,
  goToPage,
  isSelected,
  pageCount,
  pinnedRowEdge,
  pinRow,
  setSelected,
  toggleExpanded,
  toggleSelected,
} from "./session.js";
import { compareValues } from "./sort.js";
import { trace } from "./trace.js";
import {
  canMoveColumn,
  columnOrder,
  COLUMN_WIDTH_STEP,
  isVisible,
  MIN_COLUMN_WIDTH,
  moveColumn,
  pinColumn,
  pinnedEdgeOf,
  setColumnWidth,
  sortDirectionOf,
  sortPositionOf,
  toggleColumn,
  toggleGrouping,
  toggleSort,
  visibleColumns,
} from "./view.js";

/**
 * Методы сведения: наши имена (рыночные, OData) → готовые функции начинки.
 *
 * `average` у OData — `mean` у TanStack, `countdistinct` — `uniqueCount`. Разница в именах и
 * есть та работа, ради которой контракт держат своим: наружу мы говорим на языке свода, а не
 * на языке библиотеки, которую однажды заменим.
 */
const AGGREGATION_FNS = {
  count: aggregationFn_count,
  sum: aggregationFn_sum,
  min: aggregationFn_min,
  max: aggregationFn_max,
  average: aggregationFn_mean,
  countdistinct: aggregationFn_uniqueCount,
};

const FEATURES = tableFeatures({
  columnGroupingFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  rowAggregationFeature,
  rowExpandingFeature,
  rowPaginationFeature,
  rowPinningFeature,
  rowSelectionFeature,
  rowSortingFeature,
  coreRowModel: createCoreRowModel(),
  sortedRowModel: createSortedRowModel(),
  groupedRowModel: createGroupedRowModel(),
  expandedRowModel: createExpandedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  aggregationFns: AGGREGATION_FNS,
});

/** Что известно про ячейку тому, кто на неё смотрит снаружи. */
export interface CellContext {
  row: Row;
  rowIndex: number;
  column: ColumnSpec;
  /** Значение как оно лежит в данных, до показа. */
  value: unknown;
  /** Поле в строке ЕСТЬ — отдельно от того, пустое ли оно. */
  present: boolean;
  /** Текст, который увидит человек. */
  text: string;
}

/**
 * Чем потребитель размечает ячейку.
 *
 * Подсветка и оформление — ОДИН механизм, а не два: и то, и другое это «посмотри на строку с
 * колонкой и скажи, что с этой ячейкой не так». Таблица сама не привозит ни одного класса.
 */
export interface CellAttrs {
  highlighted?: boolean;
  class?: string;
  title?: string;
}

export interface DataTableProps {
  columns: ColumnDictionary;
  rows: readonly Row[];
  view: ViewState;
  onViewChange: (next: ViewState) => void;
  /** Состояние сеанса. Не передан — таблица держит его сама. */
  session?: SessionState;
  onSessionChange?: (next: SessionState) => void;
  /**
   * Тождество строки. По умолчанию — порядковый номер в поданном наборе.
   *
   * Умолчание годится, пока набор целиком приходит с клиента и не меняется под руками; как
   * только появятся живые изменения, тождество обязано прийти из данных, иначе выделение,
   * закрепление и сортировка будут говорить про разные строки.
   */
  rowId?: (row: Row, index: number) => string;
  onCellClick?: (context: CellContext) => void;
  cellAttrs?: (context: CellContext) => CellAttrs | undefined;
  /** Служебная колонка с выделением и закреплением строк. */
  selectable?: boolean;
  /**
   * Управление колонкой ПРЯМО В КОЛОНКЕ — ряд кнопок под её названием: подвинуть, прижать к
   * краю, собрать в группы, скрыть, вернуть ширину.
   *
   * Выключено по умолчанию, и это не осторожность, а безголовость: таблица, которая показывает
   * данные, не обязана везти управление видом. Включает тот, кому оно нужно.
   *
   * Цена названа: ряд стоит до шести остановок табуляции НА КОЛОНКУ, и на широком словаре
   * дорога до первой ячейки становится длинной. Станет больно — ряд свернётся в роящийся
   * `tabindex`, как это уже сделано для ячеек.
   */
  columnMenu?: boolean;
  /** Итоговая строка по колонкам, у которых объявлен метод сведения. */
  totals?: boolean;
  locale?: string;
  caption?: string;
}

export function DataTable(props: DataTableProps) {
  const locale = () => props.locale ?? DEFAULT_LOCALE;
  const byName = createMemo(() => new Map(props.columns.map((column) => [column.name, column])));
  const interactive = () => props.onCellClick !== undefined;
  const grouped = () => props.view.grouping.length > 0;

  const [ownSession, setOwnSession] = createSignal<SessionState>(EMPTY_SESSION);
  const session = (): SessionState => props.session ?? ownSession();
  const putSession = (next: SessionState): void => {
    if (props.session === undefined) setOwnSession(next);
    props.onSessionChange?.(next);
  };

  // Набор сократился — страница №7 могла перестать существовать. Показывать пустоту вместо
  // последней страницы значит соврать, что данных нет.
  createEffect(
    on(
      () => [props.rows.length, props.view.pageSize] as const,
      () => {
        const next = clampPage(session(), props.rows.length, props.view.pageSize);
        if (next !== session()) putSession(next);
      },
      { defer: true },
    ),
  );

  // Ячейка, которая держит фокус. Роящийся `tabindex`: в порядке обхода стоит ОДНА ячейка,
  // остальные достаются стрелками. Иначе таблица на тысячу строк добавила бы тысячи
  // остановок табуляции — формально доступно, практически непроходимо.
  const [active, setActive] = createSignal<{ row: number; column: number }>({ row: 0, column: 0 });
  let root: HTMLTableElement | undefined;

  const columnDefs = createMemo(() =>
    props.columns.map((column) => ({
      id: column.name,
      header: column.label,
      accessorFn: (row: Row) => lookup(row, column.name).value,
      enableSorting: column.sortable !== false,
      enableGrouping: groupableBy(column),
      aggregationFn: (column.aggregate ?? "count") as AggregateKind,
      size: props.view.widths[column.name],
      sortFn: (
        a: { id: string; getValue: (id: string) => unknown },
        b: { id: string; getValue: (id: string) => unknown },
      ) => {
        const compared = compareValues(a.getValue(column.name), b.getValue(column.name), column.type, locale());
        // ТАЙ-БРЕЙКЕР: порядок обязан быть полным, иначе равные строки скачут местами между
        // пересортировками. Разворот на «по убыванию» делает движок — он развернёт и его.
        return compared !== 0 ? compared : a.id.localeCompare(b.id);
      },
    })),
  );

  const table = createTable({
    features: FEATURES,
    get data() {
      return props.rows as Row[];
    },
    get columns() {
      return columnDefs();
    },
    getRowId: (row: Row, index: number) => props.rowId?.(row, index) ?? String(index),
    get state() {
      const current = session();
      return {
        sorting: props.view.sorting.map((rule) => ({ id: rule.field, desc: rule.direction === "desc" })),
        columnOrder: columnOrder(props.columns, props.view),
        columnVisibility: Object.fromEntries(props.view.hidden.map((name) => [name, false])),
        columnPinning: props.view.pinned,
        columnSizing: props.view.widths,
        grouping: props.view.grouping,
        expanded:
          current.expanded === "all"
            ? (true as const)
            : (Object.fromEntries(current.expanded.map((id) => [id, true])) as Record<string, true>),
        rowSelection: Object.fromEntries(current.selected.map((id) => [id, true])) as Record<string, true>,
        rowPinning: current.pinnedRows,
        // Листания нет — одна страница на всё. Число строк подставлять НЕЛЬЗЯ: группировка
        // добавляет к набору строки-группы, и страница «ровно по числу исходных строк»
        // обрезала бы последние группы. Ловится только на группировке — поэтому проба есть.
        pagination:
          props.view.pageSize === null
            ? { pageIndex: 0, pageSize: Number.MAX_SAFE_INTEGER }
            : { pageIndex: current.page, pageSize: props.view.pageSize },
      };
    },
  });

  const rows = createMemo(() => {
    const done = trace("rowModel");
    const model = [...table.getTopRows(), ...table.getCenterRows(), ...table.getBottomRows()];
    done(`строк ${model.length}`);
    return model;
  });

  const shown = createMemo(() => visibleColumns(props.columns, props.view));

  // Колонки собираются ПО ОБЛАСТЯМ: прижатые к началу, середина, прижатые к концу. Общий
  // список у начинки для этого не годится — прижатая колонка попадает в него дважды, и
  // заголовок задваивался бы. Поймано пробой на закреплении.
  const columnsShown = createMemo(() => [
    ...table.getStartVisibleLeafColumns(),
    ...table.getCenterVisibleLeafColumns(),
    ...table.getEndVisibleLeafColumns(),
  ]);
  const columnIds = createMemo(() => columnsShown().map((column) => column.id));

  /**
   * Нумерация строк для вспомогательной технологии — только когда в DOM НЕ весь набор.
   *
   * `aria-rowcount`/`aria-rowindex` существуют именно для этого случая (WAI-ARIA 1.2: индекс
   * «with respect to the total number of rows»). При листании в DOM лежит страница — значит
   * атрибуты нужны. При группировке их НЕ проставляем: строки становятся деревом, и позиция
   * относительно полного набора перестаёт быть определённой, а соврать числом хуже, чем
   * промолчать.
   */
  const numbering = () => props.view.pageSize !== null && !grouped();

  const focusCell = (row: number, column: number): void => {
    const limitRow = Math.max(0, Math.min(row, rows().length - 1));
    const limitColumn = Math.max(0, Math.min(column, columnsShown().length - 1));
    setActive({ row: limitRow, column: limitColumn });
    root
      ?.querySelector<HTMLElement>(
        `[data-slot~='table-cell'][data-row-index='${limitRow}'][data-column-index='${limitColumn}']`,
      )
      ?.focus();
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (!interactive()) return;
    const { row, column } = active();

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focusCell(row + 1, column);
        return;
      case "ArrowUp":
        event.preventDefault();
        focusCell(row - 1, column);
        return;
      case "ArrowRight":
        event.preventDefault();
        focusCell(row, column + 1);
        return;
      case "ArrowLeft":
        event.preventDefault();
        focusCell(row, column - 1);
        return;
      case "Home":
        event.preventDefault();
        focusCell(row, 0);
        return;
      case "End":
        event.preventDefault();
        focusCell(row, columnsShown().length - 1);
        return;
      default:
    }
  };

  const allSelected = () =>
    props.rows.length > 0 && session().selected.length === props.rows.length;

  const toggleAll = (): void => {
    const ids = props.rows.map((row, index) => props.rowId?.(row, index) ?? String(index));
    putSession(setSelected(session(), allSelected() ? [] : ids));
  };

  return (
    <table
      ref={root}
      data-slot="table"
      data-grouped={grouped() ? "" : undefined}
      // Роль зависит от того, что таблица на самом деле умеет. `grid` обещает клавиатурную
      // модель, `treegrid` — ещё и раскрытие; объявлять их без этого значит соврать.
      role={interactive() ? (grouped() ? "treegrid" : "grid") : undefined}
      aria-rowcount={numbering() ? props.rows.length + 1 : undefined}
      onKeyDown={onKeyDown}
    >
      <Show when={props.caption}>{(text) => <caption data-slot="table-caption">{text()}</caption>}</Show>

      <thead data-slot="table-head">
        <tr data-slot="table-head-row" aria-rowindex={numbering() ? 1 : undefined}>
          <Show when={props.selectable}>
            <th data-slot="table-service" scope="col">
              <input
                type="checkbox"
                data-slot="table-select-all"
                aria-label="Выделить все строки"
                checked={allSelected()}
                onChange={toggleAll}
              />
            </th>
          </Show>

          {/* Обходим идентификаторы, а не объекты заголовков: начинка пересоздаёт их на
              каждой правке состояния, и разметка заголовка перерисовывалась бы целиком —
              вместе с фокусом на ручке ширины. Порядок берём у неё же. */}
          <For each={columnIds()}>
            {(columnId) => {
              const column = () => byName().get(columnId);
              const sortable = () => column()?.sortable !== false;
              const direction = () => sortDirectionOf(props.view, columnId);
              const position = () => sortPositionOf(props.view, columnId);
              const pinnedAt = () => pinnedEdgeOf(props.view, columnId);
              const width = () => props.view.widths[columnId];

              return (
                <th
                  data-slot="table-header"
                  data-column={columnId}
                  data-pinned={pinnedAt() ?? undefined}
                  data-grouped={props.view.grouping.includes(columnId) ? "" : undefined}
                  scope="col"
                  style={width() === undefined ? undefined : { width: `${width()!}px` }}
                  aria-sort={
                    !sortable()
                      ? undefined
                      : direction() === "asc"
                        ? "ascending"
                        : direction() === "desc"
                          ? "descending"
                          : "none"
                  }
                >
                  <Show
                    when={sortable()}
                    fallback={<span data-slot="table-header-label">{column()?.label}</span>}
                  >
                    <button
                      type="button"
                      data-slot="table-header-sort"
                      data-direction={direction() ?? undefined}
                      onClick={(event) =>
                        props.onViewChange(toggleSort(props.view, columnId, event.shiftKey))
                      }
                    >
                      {column()?.label}
                      <Show when={props.view.sorting.length > 1 && position() > 0}>
                        {/* Место ключа в множественной сортировке: без него две стрелки не
                            говорят, какая из них главнее. */}
                        <span data-slot="table-header-sort-position">{position()}</span>
                      </Show>
                    </button>
                  </Show>

                  {/* Управление колонкой живёт В КОЛОНКЕ, под её названием: то, чем управляют,
                      и то, чем управляют этим, стоят рядом. Отдельная панель заставляла бы
                      каждый раз искать нужную строку списка глазами и сверять её с таблицей. */}
                  <Show when={props.columnMenu}>
                    <div
                      data-slot="table-column-menu"
                      role="group"
                      aria-label={`Колонка «${column()?.label ?? columnId}»`}
                    >
                      {/* Прижатой колонке двигаться некуда: её место задаёт край, а не порядок.
                          Кнопок нет вовсе — нажатие, которое ничего не меняет, врёт молча. */}
                      <Show when={pinnedAt() === null}>
                        <button
                          type="button"
                          data-slot="table-column-up"
                          aria-label={`Подвинуть колонку «${column()?.label ?? columnId}» влево`}
                          disabled={!canMoveColumn(props.columns, props.view, columnId, -1)}
                          onClick={() =>
                            props.onViewChange(moveColumn(props.columns, props.view, columnId, -1))
                          }
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          data-slot="table-column-down"
                          aria-label={`Подвинуть колонку «${column()?.label ?? columnId}» вправо`}
                          disabled={!canMoveColumn(props.columns, props.view, columnId, 1)}
                          onClick={() =>
                            props.onViewChange(moveColumn(props.columns, props.view, columnId, 1))
                          }
                        >
                          →
                        </button>
                      </Show>

                      <button
                        type="button"
                        data-slot="table-column-pin"
                        data-pinned={pinnedAt() ?? undefined}
                        aria-label={`Закрепить колонку «${column()?.label ?? columnId}» слева`}
                        aria-pressed={pinnedAt() === "start"}
                        onClick={() =>
                          props.onViewChange(
                            pinColumn(props.view, columnId, pinnedAt() === "start" ? null : "start"),
                          )
                        }
                      >
                        ⇤
                      </button>
                      <button
                        type="button"
                        data-slot="table-column-pin-end"
                        data-pinned={pinnedAt() ?? undefined}
                        aria-label={`Закрепить колонку «${column()?.label ?? columnId}» справа`}
                        aria-pressed={pinnedAt() === "end"}
                        onClick={() =>
                          props.onViewChange(
                            pinColumn(props.view, columnId, pinnedAt() === "end" ? null : "end"),
                          )
                        }
                      >
                        ⇥
                      </button>

                      <Show when={column() && groupableBy(column()!)}>
                        <button
                          type="button"
                          data-slot="table-column-group"
                          aria-label={`Собрать строки в группы по колонке «${column()?.label ?? columnId}»`}
                          aria-pressed={props.view.grouping.includes(columnId)}
                          onClick={() => props.onViewChange(toggleGrouping(props.view, columnId))}
                        >
                          ⊞
                        </button>
                      </Show>

                      <button
                        type="button"
                        data-slot="table-column-hide"
                        aria-label={`Скрыть колонку «${column()?.label ?? columnId}»`}
                        onClick={() => props.onViewChange(toggleColumn(props.view, columnId))}
                      >
                        ✕
                      </button>

                      <Show when={width() !== undefined}>
                        <button
                          type="button"
                          data-slot="table-column-width-reset"
                          aria-label={`Вернуть ширину колонки «${column()?.label ?? columnId}»`}
                          onClick={() => props.onViewChange(setColumnWidth(props.view, columnId, null))}
                        >
                          ↔
                        </button>
                      </Show>
                    </div>
                  </Show>

                  {/* Ручка ширины — `separator` с клавиатурой: тянуть мышью умеют не все. */}
                  <span
                    data-slot="table-column-resize"
                    role="separator"
                    aria-orientation="vertical"
                    aria-label={`Ширина колонки «${column()?.label ?? columnId}»`}
                    tabIndex={0}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      const from = event.clientX;
                      const base = width() ?? MIN_COLUMN_WIDTH * 2;
                      const move = (moved: PointerEvent) =>
                        props.onViewChange(
                          setColumnWidth(props.view, columnId, base + (moved.clientX - from)),
                        );
                      const stop = () => {
                        globalThis.removeEventListener("pointermove", move);
                        globalThis.removeEventListener("pointerup", stop);
                      };
                      globalThis.addEventListener("pointermove", move);
                      globalThis.addEventListener("pointerup", stop);
                    }}
                    onKeyDown={(event) => {
                      const base = width() ?? MIN_COLUMN_WIDTH * 2;
                      if (event.key === "ArrowRight") {
                        event.preventDefault();
                        props.onViewChange(setColumnWidth(props.view, columnId, base + COLUMN_WIDTH_STEP));
                      } else if (event.key === "ArrowLeft") {
                        event.preventDefault();
                        props.onViewChange(setColumnWidth(props.view, columnId, base - COLUMN_WIDTH_STEP));
                      } else if (event.key === "Enter") {
                        // Enter возвращает ширину разметке — иначе однажды суженную колонку
                        // приходится ловить мышью обратно по пикселю.
                        event.preventDefault();
                        props.onViewChange(setColumnWidth(props.view, columnId, null));
                      }
                    }}
                  />
                </th>
              );
            }}
          </For>
        </tr>
      </thead>

      <tbody data-slot="table-body">
        <For each={rows()}>
          {(row, rowIndex) => {
            const pinnedAt = () => pinnedRowEdge(session(), row.id);
            const globalIndex = () => session().page * (props.view.pageSize ?? 0) + rowIndex() + 2;

            return (
              <tr
                data-slot="table-row"
                data-row-id={row.id}
                data-pinned={pinnedAt() ?? undefined}
                data-depth={row.depth > 0 ? row.depth : undefined}
                data-group={row.getIsGrouped() ? "" : undefined}
                aria-rowindex={numbering() ? globalIndex() : undefined}
                aria-selected={props.selectable ? isSelected(session(), row.id) : undefined}
                aria-expanded={row.getIsGrouped() ? row.getIsExpanded() : undefined}
              >
                <Show when={props.selectable}>
                  <td data-slot="table-service">
                    <input
                      type="checkbox"
                      data-slot="table-select-row"
                      aria-label={`Выделить строку ${rowIndex() + 1}`}
                      checked={isSelected(session(), row.id)}
                      onChange={() => putSession(toggleSelected(session(), row.id))}
                    />
                    <button
                      type="button"
                      data-slot="table-pin-row"
                      data-pinned={pinnedAt() ?? undefined}
                      aria-label={`Закрепить строку ${rowIndex() + 1}`}
                      aria-pressed={pinnedAt() !== null}
                      onClick={() =>
                        putSession(pinRow(session(), row.id, pinnedAt() === null ? "top" : null))
                      }
                    >
                      ⌖
                    </button>
                  </td>
                </Show>

                <For
                  each={[
                    ...row.getStartVisibleCells(),
                    ...row.getCenterVisibleCells(),
                    ...row.getEndVisibleCells(),
                  ]}
                >
                  {(cell, columnIndex) => {
                    const column = () => byName().get(cell.column.id);
                    const found = () => lookup(row.original, cell.column.id);
                    const isGroupCell = () => cell.getIsGrouped();
                    const isAggregated = () => cell.getIsAggregated();
                    const isPlaceholder = () => cell.getIsPlaceholder();

                    const shownValue = () => {
                      const spec = column();
                      if (!spec) return { text: "", attrs: {} as Record<string, string> };
                      if (isGroupCell()) {
                        return formatValue(cell.getValue(), spec, locale());
                      }
                      if (isAggregated()) {
                        const value = cell.getValue();
                        return value === null || value === undefined
                          ? { text: "", attrs: {} as Record<string, string> }
                          : formatValue(value, spec, locale());
                      }
                      return formatValue(found().value, spec, locale());
                    };

                    const context = (): CellContext | null => {
                      const spec = column();
                      if (!spec || row.getIsGrouped()) return null;
                      return {
                        row: row.original,
                        rowIndex: rowIndex(),
                        column: spec,
                        value: found().value,
                        present: found().found,
                        text: shownValue().text,
                      };
                    };

                    const extra = () => {
                      const ctx = context();
                      return ctx ? props.cellAttrs?.(ctx) : undefined;
                    };

                    const focused = () =>
                      active().row === rowIndex() && active().column === columnIndex();

                    return (
                      <td
                        data-slot="table-cell"
                        data-column={cell.column.id}
                        data-row-index={rowIndex()}
                        data-column-index={columnIndex()}
                        data-format={column() ? formatOf(column()!) : undefined}
                        data-pinned={pinnedEdgeOf(props.view, cell.column.id) ?? undefined}
                        data-group-cell={isGroupCell() ? "" : undefined}
                        data-aggregated={isAggregated() ? "" : undefined}
                        // Три состояния поля различаются НА ЭКРАНЕ, как и в фильтре: поля нет ·
                        // поле есть и пустое · поле есть и заполнено.
                        data-missing={
                          isGroupCell() || isAggregated() || isPlaceholder() || found().found
                            ? undefined
                            : ""
                        }
                        data-empty={
                          !isGroupCell() && !isAggregated() && found().found && shownValue().text === ""
                            ? ""
                            : undefined
                        }
                        data-highlighted={extra()?.highlighted ? "" : undefined}
                        data-clickable={interactive() && !row.getIsGrouped() ? "" : undefined}
                        class={extra()?.class}
                        title={extra()?.title}
                        style={
                          props.view.widths[cell.column.id] === undefined
                            ? undefined
                            : { width: `${props.view.widths[cell.column.id]!}px` }
                        }
                        tabIndex={interactive() ? (focused() ? 0 : -1) : undefined}
                        onFocus={() => setActive({ row: rowIndex(), column: columnIndex() })}
                        onClick={() => {
                          const ctx = context();
                          if (ctx) props.onCellClick?.(ctx);
                        }}
                        onKeyDown={(event) => {
                          if (event.key !== "Enter" && event.key !== " ") return;
                          const ctx = context();
                          if (!ctx) return;
                          event.preventDefault();
                          props.onCellClick?.(ctx);
                        }}
                        {...shownValue().attrs}
                      >
                        <Show when={isGroupCell()}>
                          <button
                            type="button"
                            data-slot="table-group-toggle"
                            aria-expanded={row.getIsExpanded()}
                            onClick={() =>
                              putSession(
                                toggleExpanded(
                                  session(),
                                  row.id,
                                  rows().map((item) => item.id),
                                ),
                              )
                            }
                          >
                            {row.getIsExpanded() ? "−" : "+"}
                          </button>
                        </Show>

                        <Show when={!isPlaceholder()}>{shownValue().text}</Show>

                        <Show when={isGroupCell()}>
                          {/* Сколько строк в группе — счёт членов, как `$count` у OData. */}
                          <span data-slot="table-group-count">{row.subRows.length}</span>
                        </Show>
                      </td>
                    );
                  }}
                </For>
              </tr>
            );
          }}
        </For>
      </tbody>

      <Show when={props.totals}>
        <tfoot data-slot="table-foot">
          <tr data-slot="table-foot-row">
            <Show when={props.selectable}>
              <td data-slot="table-service" />
            </Show>
            <For each={shown()}>
              {(column) => {
                // Итог берётся по ВСЕМ поданным строкам — после отбора и до листания, как
                // `/$count` у OData. Итог по одной странице — не итог, а сумма увиденного.
                const total = () => (column.aggregate ? aggregate(props.rows, column) : null);

                return (
                  <td data-slot="table-total" data-column={column.name} data-aggregate={column.aggregate}>
                    <Show when={total()} keyed>
                      {(value) =>
                        value.value === null
                          ? "—"
                          : value.counting
                            ? new Intl.NumberFormat(locale()).format(value.value)
                            : formatValue(value.value, column, locale()).text
                      }
                    </Show>
                  </td>
                );
              }}
            </For>
          </tr>
        </tfoot>
      </Show>
    </table>
  );
}

export interface HiddenColumnsProps {
  columns: ColumnDictionary;
  view: ViewState;
  onViewChange: (next: ViewState) => void;
}

/**
 * Скрытые колонки — и кнопка «вернуть» у каждой.
 *
 * Единственная часть управления колонками, которой НЕЛЬЗЯ жить в самой колонке: колонки на
 * экране больше нет, а значит нет и места, куда нажать. Скрыть без возможности вернуть —
 * ловушка, поэтому список показывается ровно тогда, когда что-то скрыто, и молчит в остальное
 * время. Всё прочее управление живёт в заголовке колонки (`columnMenu` у {@link DataTable}).
 *
 * Порядок — тот же, что у вида: колонка возвращается на своё место, а не в конец.
 */
export function HiddenColumns(props: HiddenColumnsProps) {
  const byName = createMemo(() => new Map(props.columns.map((column) => [column.name, column])));
  const hidden = createMemo(() =>
    columnOrder(props.columns, props.view).filter((name) => !isVisible(props.view, name)),
  );

  return (
    <Show when={hidden().length > 0}>
      <ul data-slot="table-hidden-columns" aria-label="Скрытые колонки">
        <For each={hidden()}>
          {(name) => {
            const label = () => byName().get(name)?.label ?? name;

            return (
              <li data-slot="table-hidden-column" data-column={name}>
                <button
                  type="button"
                  data-slot="table-column-show"
                  aria-label={`Вернуть колонку «${label()}»`}
                  onClick={() => props.onViewChange(toggleColumn(props.view, name))}
                >
                  {/* Только название колонки. Плюсика тут больше нет: он был чистым
                      украшением (`aria-hidden`), то есть видом, поставленным изнутри — а
                      значит вторым источником вида рядом с оформлением потребителя. Смысл
                      кнопки несёт `aria-label`, вид — тот, кто одевает. */}
                  {label()}
                </button>
              </li>
            );
          }}
        </For>
      </ul>
    </Show>
  );
}

export interface TablePagerProps {
  /** Сколько строк подано таблице — после отбора и до листания. */
  total: number;
  view: ViewState;
  onViewChange: (next: ViewState) => void;
  session: SessionState;
  onSessionChange: (next: SessionState) => void;
  /** Что предложить в выборе размера страницы. */
  sizes?: readonly number[];
}

/**
 * Листание — СМЕЩЕНИЕМ, и это решение с ценой.
 *
 * Рынок для меняющихся наборов нормирует КУРСОР (AIP-158: непрозрачный `page_token` вместо
 * смещения, потому что смещение разъезжается при вставках выше страницы). У нас весь набор
 * лежит на клиенте и под руками не меняется, поэтому смещение честно и даёт то, чего курсор
 * не умеет, — прыжок на произвольную страницу. Как только листание уедет на сервер, смещение
 * станет хрупким, и понадобится курсор: это названо заранее, а не выяснится на живых данных.
 *
 * Страницы не «едут» ещё и потому, что порядок у нас ПОЛНЫЙ — с тай-брейкером (см. `sort.ts`).
 */
export function TablePager(props: TablePagerProps) {
  const pages = createMemo(() => pageCount(props.total, props.view.pageSize));
  const page = () => props.session.page;

  const go = (next: number) =>
    props.onSessionChange(goToPage(props.session, next, props.total, props.view.pageSize));

  return (
    <nav data-slot="table-pager" aria-label="Листание таблицы">
      <button
        type="button"
        data-slot="table-pager-prev"
        aria-label="Предыдущая страница"
        disabled={page() === 0 || props.view.pageSize === null}
        onClick={() => go(page() - 1)}
      >
        ←
      </button>

      <span data-slot="table-pager-position" aria-live="polite">
        <Show when={props.view.pageSize !== null} fallback="без листания">
          страница {page() + 1} из {pages()}
        </Show>
      </span>

      <button
        type="button"
        data-slot="table-pager-next"
        aria-label="Следующая страница"
        disabled={page() >= pages() - 1 || props.view.pageSize === null}
        onClick={() => go(page() + 1)}
      >
        →
      </button>

      <label data-slot="table-pager-size">
        строк на странице
        {/* Зацепка есть и на подписи, и на самом поле: подпись оденут как подпись, поле как
            поле, и одеть одно через другое нельзя. Полусоставная часть неодеваема. */}
        <select
          data-slot="table-pager-size-select"
          value={String(props.view.pageSize ?? "")}
          onChange={(event) => {
            const raw = event.currentTarget.value;
            const size = raw === "" ? null : Number(raw);
            props.onViewChange({ ...props.view, pageSize: size });
            // Размер сменился — держим начало списка, иначе человек оказывается неизвестно где.
            props.onSessionChange(goToPage(props.session, 0, props.total, size));
          }}
        >
          {/* У `option` зацепки нет намеренно: оформить его браузеры почти не дают, а
              обещание на нём заморозило бы нативный `select` навсегда — замена его на
              комбобокс из кита стала бы мажором. Неодеваемые части названы в доке. */}
          <option value="">все</option>
          <For each={props.sizes ?? [10, 25, 50]}>
            {(size) => <option value={String(size)}>{size}</option>}
          </For>
        </select>
      </label>
    </nav>
  );
}

export interface GroupControlsProps {
  session: SessionState;
  onSessionChange: (next: SessionState) => void;
}

/** Раскрыть или свернуть все группы разом. */
export function GroupControls(props: GroupControlsProps) {
  return (
    <div data-slot="table-group-controls">
      <button
        type="button"
        data-slot="table-expand-all"
        onClick={() => props.onSessionChange(expandAll(props.session, true))}
      >
        раскрыть все
      </button>
      <button
        type="button"
        data-slot="table-collapse-all"
        onClick={() => props.onSessionChange(expandAll(props.session, false))}
      >
        свернуть все
      </button>
    </div>
  );
}
