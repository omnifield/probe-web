// Таблица — БЕЗГОЛОВАЯ, как и кит, на котором стоит (`kb:PROBEWEB-4`).
//
// Начинка чужая и проверенная, контракт наш (`kb:WEBER-16`): порядок колонок, их видимость и
// сортированная модель строк берутся у TanStack v9 — возможности подключаются поштучно, и в
// сборку не тянется то, чем мы не пользуемся. Проверено на установленном пакете 9.1.2, а не
// по памяти (`tasker:TABLES-5`).
//
// ФИЛЬТРАЦИЮ TanStack мы НЕ подключаем сознательно: фильтры у нас свои и это отдельный
// продукт. Две фильтрации в одной таблице разъехались бы на первой правке, и владельца у
// такого шва не было бы.
//
// Состояние вида целиком снаружи: таблица ничего не помнит сама. Так вид можно сохранить,
// привезти с бэка и вернуть — ровно как состояние фильтра.

import {
  columnOrderingFeature,
  columnVisibilityFeature,
  createCoreRowModel,
  createSortedRowModel,
  createTable,
  rowSortingFeature,
  tableFeatures,
} from "@tanstack/solid-table";
import { createMemo, createSignal, For, type JSX, Show } from "solid-js";

import { lookup } from "../filters/index.js";
import { DEFAULT_LOCALE, formatValue } from "./format.js";
import {
  type ColumnDictionary,
  type ColumnSpec,
  type FieldRef,
  formatOf,
  type Row,
  type ViewState,
} from "./model.js";
import { compareValues } from "./sort.js";
import { trace } from "./trace.js";
import {
  columnOrder,
  isVisible,
  moveColumn,
  sortDirectionOf,
  sortPositionOf,
  toggleColumn,
  toggleSort,
} from "./view.js";

const FEATURES = tableFeatures({
  columnOrderingFeature,
  columnVisibilityFeature,
  rowSortingFeature,
  coreRowModel: createCoreRowModel(),
  sortedRowModel: createSortedRowModel(),
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
  /**
   * Тождество строки. По умолчанию — порядковый номер в поданном наборе.
   *
   * Умолчание годится, пока набор целиком приходит с клиента и не меняется под руками; как
   * только появятся живые изменения, тождество обязано прийти из данных, иначе сортировка и
   * дельты будут говорить про разные строки.
   */
  rowId?: (row: Row, index: number) => string;
  onCellClick?: (context: CellContext) => void;
  cellAttrs?: (context: CellContext) => CellAttrs | undefined;
  locale?: string;
  caption?: string;
}

export function DataTable(props: DataTableProps) {
  const locale = () => props.locale ?? DEFAULT_LOCALE;
  const byName = createMemo(() => new Map(props.columns.map((column) => [column.name, column])));
  const interactive = () => props.onCellClick !== undefined;

  // Ячейка, которая держит фокус. Роящийся `tabindex` (roving tabindex): в порядке обхода
  // стоит ОДНА ячейка, остальные достаются стрелками. Иначе таблица на тысячу строк добавила
  // бы тысячи остановок табуляции — формально доступно, практически непроходимо.
  const [active, setActive] = createSignal<{ row: number; column: number }>({ row: 0, column: 0 });
  let root: HTMLTableElement | undefined;

  const columnDefs = createMemo(() =>
    props.columns.map((column) => ({
      id: column.name,
      header: column.label,
      accessorFn: (row: Row) => lookup(row, column.name).value,
      enableSorting: column.sortable !== false,
      sortFn: (a: { id: string; getValue: (id: string) => unknown }, b: { id: string; getValue: (id: string) => unknown }) => {
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
      return {
        sorting: props.view.sorting.map((rule) => ({ id: rule.field, desc: rule.direction === "desc" })),
        columnOrder: columnOrder(props.columns, props.view),
        columnVisibility: Object.fromEntries(props.view.hidden.map((name) => [name, false])),
      };
    },
  });

  const rows = createMemo(() => {
    const done = trace("rowModel");
    const model = table.getRowModel().rows;
    done(`строк ${model.length}`);
    return model;
  });

  const columnsShown = createMemo(() => table.getVisibleLeafColumns());

  const focusCell = (row: number, column: number): void => {
    const limitRow = Math.max(0, Math.min(row, rows().length - 1));
    const limitColumn = Math.max(0, Math.min(column, columnsShown().length - 1));
    setActive({ row: limitRow, column: limitColumn });
    root
      ?.querySelector<HTMLElement>(
        `[data-slot='table-cell'][data-row-index='${limitRow}'][data-column-index='${limitColumn}']`,
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

  return (
    <table
      ref={root}
      data-slot="table"
      // Роль зависит от того, интерактивны ли ячейки. `grid` обещает вспомогательной
      // технологии клавиатурную модель — объявлять его без неё значит соврать.
      role={interactive() ? "grid" : undefined}
      onKeyDown={onKeyDown}
    >
      <Show when={props.caption}>{(text) => <caption data-slot="table-caption">{text()}</caption>}</Show>

      <thead data-slot="table-head">
        <For each={table.getHeaderGroups()}>
          {(group) => (
            <tr data-slot="table-head-row">
              <For each={group.headers}>
                {(header) => {
                  const column = () => byName().get(header.column.id);
                  const sortable = () => column()?.sortable !== false;
                  const direction = () => sortDirectionOf(props.view, header.column.id);
                  const position = () => sortPositionOf(props.view, header.column.id);

                  return (
                    <th
                      data-slot="table-header"
                      data-column={header.column.id}
                      scope="col"
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
                        fallback={<span data-slot="header-label">{column()?.label}</span>}
                      >
                        <button
                          type="button"
                          data-slot="header-sort"
                          data-direction={direction() ?? undefined}
                          onClick={(event) =>
                            props.onViewChange(toggleSort(props.view, header.column.id, event.shiftKey))
                          }
                        >
                          {column()?.label}
                          <Show when={props.view.sorting.length > 1 && position() > 0}>
                            {/* Место ключа в множественной сортировке: без него две стрелки
                                не говорят, какая из них главнее. */}
                            <span data-slot="header-sort-position">{position()}</span>
                          </Show>
                        </button>
                      </Show>
                    </th>
                  );
                }}
              </For>
            </tr>
          )}
        </For>
      </thead>

      <tbody data-slot="table-body">
        <For each={rows()}>
          {(row, rowIndex) => (
            <tr data-slot="table-row" data-row-id={row.id}>
              <For each={row.getVisibleCells()}>
                {(cell, columnIndex) => {
                  const column = () => byName().get(cell.column.id);
                  const found = () => lookup(row.original, cell.column.id);
                  const shown = () => {
                    const spec = column();
                    return spec
                      ? formatValue(found().value, spec, locale())
                      : { text: "", attrs: {} as Record<string, string> };
                  };

                  const context = (): CellContext | null => {
                    const spec = column();
                    if (!spec) return null;
                    return {
                      row: row.original,
                      rowIndex: rowIndex(),
                      column: spec,
                      value: found().value,
                      present: found().found,
                      text: shown().text,
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
                      // Три состояния поля различаются НА ЭКРАНЕ, как и в фильтре: поля нет ·
                      // поле есть и пустое · поле есть и заполнено.
                      data-missing={found().found ? undefined : ""}
                      data-empty={found().found && shown().text === "" ? "" : undefined}
                      data-highlighted={extra()?.highlighted ? "" : undefined}
                      data-clickable={interactive() ? "" : undefined}
                      class={extra()?.class}
                      title={extra()?.title}
                      tabIndex={interactive() ? (focused() ? 0 : -1) : undefined}
                      onFocus={() => setActive({ row: rowIndex(), column: columnIndex() })}
                      onClick={() => {
                        const ctx = context();
                        if (ctx) props.onCellClick?.(ctx);
                      }}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter" && event.key !== " ") return;
                        event.preventDefault();
                        const ctx = context();
                        if (ctx) props.onCellClick?.(ctx);
                      }}
                      {...shown().attrs}
                    >
                      {shown().text}
                    </td>
                  );
                }}
              </For>
            </tr>
          )}
        </For>
      </tbody>
    </table>
  );
}

export interface ColumnControlsProps {
  columns: ColumnDictionary;
  view: ViewState;
  onViewChange: (next: ViewState) => void;
}

/**
 * Управление колонками: показать/скрыть и подвинуть.
 *
 * Тоже безголовое — кнопки без единого класса и с зацепками `data-slot`. Это НЕ панель
 * настроек: панель со своим видом собирает потребитель, а здесь минимум, которым он
 * пользуется и который проверяется пробой.
 */
export function ColumnControls(props: ColumnControlsProps) {
  const order = createMemo(() => columnOrder(props.columns, props.view));
  const byName = createMemo(() => new Map(props.columns.map((column) => [column.name, column])));

  const move = (field: FieldRef, step: -1 | 1) =>
    props.onViewChange(moveColumn(props.columns, props.view, field, step));

  return (
    <ul data-slot="column-controls">
      <For each={order()}>
        {(name, index) => {
          const column = () => byName().get(name);
          const shown = () => isVisible(props.view, name);

          return (
            <li data-slot="column-control" data-column={name} data-hidden={shown() ? undefined : ""}>
              <label data-slot="column-toggle">
                <input
                  type="checkbox"
                  checked={shown()}
                  onChange={() => props.onViewChange(toggleColumn(props.view, name))}
                />
                {column()?.label ?? name}
              </label>

              <button
                type="button"
                data-slot="column-up"
                aria-label={`Подвинуть колонку «${column()?.label ?? name}» влево`}
                disabled={index() === 0}
                onClick={() => move(name, -1)}
              >
                ←
              </button>
              <button
                type="button"
                data-slot="column-down"
                aria-label={`Подвинуть колонку «${column()?.label ?? name}» вправо`}
                disabled={index() === order().length - 1}
                onClick={() => move(name, 1)}
              >
                →
              </button>
            </li>
          );
        }}
      </For>
    </ul>
  );
}

export type { JSX };
