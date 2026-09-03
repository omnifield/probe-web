import {
  type Cell,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnPinningState,
  type ColumnVisibilityState,
  columnFacetingFeature,
  columnFilteringFeature,
  columnPinningFeature,
  columnVisibilityFeature,
  createCoreRowModel,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createSortedRowModel,
  createTable,
  filterFn_includesString,
  globalFilteringFeature,
  type Header,
  type Row as TanstackRow,
  type RowData,
  type RowSelectionState,
  rowSelectionFeature,
  rowSortingFeature,
  type SolidTable,
  tableFeatures,
} from "@tanstack/solid-table";
import { createSignal, splitProps, type JSX } from "solid-js";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";
import { anatomyParts } from "../entity/anatomy.js";
import { DefaultTableBody } from "./default-body.js";

const FEATURES = tableFeatures({
  rowSortingFeature,
  rowSelectionFeature,
  columnVisibilityFeature,
  columnPinningFeature,
  columnFilteringFeature,
  globalFilteringFeature,
  columnFacetingFeature,
  coreRowModel: createCoreRowModel(),
  sortedRowModel: createSortedRowModel(),
  filteredRowModel: createFilteredRowModel(),
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  filterFns: { includesString: filterFn_includesString },
});

type Features = typeof FEATURES;

export type TableColumn<TData extends RowData> = ColumnDef<Features, TData>;
export type TableInstance<TData extends RowData> = SolidTable<Features, TData>;
export type TableColumnHeader<TData extends RowData> = Header<Features, TData>;
export type TableDataRow<TData extends RowData> = TanstackRow<Features, TData>;
export type TableDataCell<TData extends RowData> = Cell<Features, TData, unknown>;
export type TableRowSelection = RowSelectionState;
export type TableColumnVisibility = ColumnVisibilityState;
export type TableColumnPinning = ColumnPinningState;
export type TableColumnFilters = ColumnFiltersState;

export interface TableSort {
  columnId: string;
  desc: boolean;
}

function toSortingState(sort: readonly TableSort[]): { id: string; desc: boolean }[] {
  return sort.map((entry) => ({ id: entry.columnId, desc: entry.desc }));
}

function fromSortingState(state: readonly { id: string; desc: boolean }[]): TableSort[] {
  return state.map((entry) => ({ columnId: entry.id, desc: entry.desc }));
}

export type TableRootProps<TData extends RowData> = Omit<
  JSX.HTMLAttributes<HTMLTableElement>,
  "children"
> & {
  columns: readonly TableColumn<TData>[];
  data: readonly TData[];
  /** Порядок массива — приоритет сортировки: первый элемент решает первым. */
  sorting?: readonly TableSort[];
  defaultSorting?: readonly TableSort[];
  onSortingChange?: (next: readonly TableSort[]) => void;
  /** Выключено по умолчанию — чекбокс-колонка стандартной структуры появляется, только если задано. */
  enableRowSelection?: boolean;
  rowSelection?: TableRowSelection;
  defaultRowSelection?: TableRowSelection;
  onRowSelectionChange?: (next: TableRowSelection) => void;
  /** Каждый ключ — id колонки, `false` прячет её. Отсутствующий ключ — видима (умолчание TanStack). */
  columnVisibility?: TableColumnVisibility;
  defaultColumnVisibility?: TableColumnVisibility;
  onColumnVisibilityChange?: (next: TableColumnVisibility) => void;
  /** `{ start: [...id], end: [...id] }` — id колонки в каждом массиве, порядок внутри массива не важен. */
  columnPinning?: TableColumnPinning;
  defaultColumnPinning?: TableColumnPinning;
  onColumnPinningChange?: (next: TableColumnPinning) => void;
  /** Ищет по всем колонкам разом, регистронезависимо, подстрокой (includesString). Поле ввода — дело потребителя, кит своей анатомии под него не заводит. */
  globalFilter?: string;
  defaultGlobalFilter?: string;
  onGlobalFilterChange?: (next: string) => void;
  /** По одному `{ id, value }` на отфильтрованную колонку. Виджет фильтра (текст/select/диапазон) — дело потребителя, живёт внутри headerCell как обычное содержимое, своей части кит не заводит. */
  columnFilters?: TableColumnFilters;
  defaultColumnFilters?: TableColumnFilters;
  onColumnFiltersChange?: (next: TableColumnFilters) => void;
  children?: (table: TableInstance<TData>) => JSX.Element;
};

export function TableRoot<TData extends RowData>(props: TableRootProps<TData>) {
  traceLife("ui.table");

  const [uncontrolledSorting, setUncontrolledSorting] =
    createSignal<readonly TableSort[]>(props.defaultSorting ?? []);
  const sorting = (): readonly TableSort[] =>
    props.sorting !== undefined ? props.sorting : uncontrolledSorting();
  const setSorting = (next: readonly TableSort[]): void => {
    if (props.sorting === undefined) setUncontrolledSorting(next);
    props.onSortingChange?.(next);
  };

  const [uncontrolledRowSelection, setUncontrolledRowSelection] =
    createSignal<TableRowSelection>(props.defaultRowSelection ?? {});
  const rowSelection = (): TableRowSelection =>
    props.rowSelection !== undefined ? props.rowSelection : uncontrolledRowSelection();
  const setRowSelection = (next: TableRowSelection): void => {
    if (props.rowSelection === undefined) setUncontrolledRowSelection(next);
    props.onRowSelectionChange?.(next);
  };

  const [uncontrolledColumnVisibility, setUncontrolledColumnVisibility] =
    createSignal<TableColumnVisibility>(props.defaultColumnVisibility ?? {});
  const columnVisibility = (): TableColumnVisibility =>
    props.columnVisibility !== undefined ? props.columnVisibility : uncontrolledColumnVisibility();
  const setColumnVisibility = (next: TableColumnVisibility): void => {
    if (props.columnVisibility === undefined) setUncontrolledColumnVisibility(next);
    props.onColumnVisibilityChange?.(next);
  };

  const [uncontrolledColumnPinning, setUncontrolledColumnPinning] =
    createSignal<TableColumnPinning>(props.defaultColumnPinning ?? { start: [], end: [] });
  const columnPinning = (): TableColumnPinning =>
    props.columnPinning !== undefined ? props.columnPinning : uncontrolledColumnPinning();
  const setColumnPinning = (next: TableColumnPinning): void => {
    if (props.columnPinning === undefined) setUncontrolledColumnPinning(next);
    props.onColumnPinningChange?.(next);
  };

  const [uncontrolledGlobalFilter, setUncontrolledGlobalFilter] =
    createSignal<string>(props.defaultGlobalFilter ?? "");
  const globalFilter = (): string =>
    props.globalFilter !== undefined ? props.globalFilter : uncontrolledGlobalFilter();
  const setGlobalFilter = (next: string): void => {
    if (props.globalFilter === undefined) setUncontrolledGlobalFilter(next);
    props.onGlobalFilterChange?.(next);
  };

  const [uncontrolledColumnFilters, setUncontrolledColumnFilters] =
    createSignal<TableColumnFilters>(props.defaultColumnFilters ?? []);
  const columnFilters = (): TableColumnFilters =>
    props.columnFilters !== undefined ? props.columnFilters : uncontrolledColumnFilters();
  const setColumnFilters = (next: TableColumnFilters): void => {
    if (props.columnFilters === undefined) setUncontrolledColumnFilters(next);
    props.onColumnFiltersChange?.(next);
  };

  const table = createTable<Features, TData>({
    features: FEATURES,
    get data() {
      return props.data as TData[];
    },
    get columns() {
      return props.columns as ColumnDef<Features, TData>[];
    },
    enableMultiSort: true,
    globalFilterFn: "includesString",
    get enableRowSelection() {
      return props.enableRowSelection ?? false;
    },
    get state() {
      return {
        sorting: toSortingState(sorting()),
        rowSelection: rowSelection(),
        columnVisibility: columnVisibility(),
        columnPinning: columnPinning(),
        globalFilter: globalFilter(),
        columnFilters: columnFilters(),
      };
    },
    onSortingChange: (updater) => {
      const current = toSortingState(sorting());
      const next = typeof updater === "function" ? updater(current) : updater;
      setSorting(fromSortingState(next));
    },
    onRowSelectionChange: (updater) => {
      const current = rowSelection();
      const next = typeof updater === "function" ? updater(current) : updater;
      setRowSelection(next);
    },
    onColumnVisibilityChange: (updater) => {
      const current = columnVisibility();
      const next = typeof updater === "function" ? updater(current) : updater;
      setColumnVisibility(next);
    },
    onColumnPinningChange: (updater) => {
      const current = columnPinning();
      const next = typeof updater === "function" ? updater(current) : updater;
      setColumnPinning(next);
    },
    onGlobalFilterChange: (updater) => {
      const current = globalFilter();
      const next = typeof updater === "function" ? updater(current) : updater;
      setGlobalFilter(next);
    },
    onColumnFiltersChange: (updater) => {
      const current = columnFilters();
      const next = typeof updater === "function" ? updater(current) : updater;
      setColumnFilters(next);
    },
  }) as TableInstance<TData>;

  const [local, rest] = splitProps(props, [
    "columns",
    "data",
    "sorting",
    "defaultSorting",
    "onSortingChange",
    "enableRowSelection",
    "rowSelection",
    "defaultRowSelection",
    "onRowSelectionChange",
    "columnVisibility",
    "defaultColumnVisibility",
    "onColumnVisibilityChange",
    "columnPinning",
    "defaultColumnPinning",
    "onColumnPinningChange",
    "globalFilter",
    "defaultGlobalFilter",
    "onGlobalFilterChange",
    "columnFilters",
    "defaultColumnFilters",
    "onColumnFiltersChange",
    "children",
  ]);

  return (
    <table {...dropAddress(rest)} {...anatomyParts.root.attrs}>
      {local.children ? local.children(table) : <DefaultTableBody table={table} />}
    </table>
  );
}
