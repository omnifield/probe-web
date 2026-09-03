import {
  type ColumnDef,
  createCoreRowModel,
  createSortedRowModel,
  createTable,
  type Header,
  type Row as TanstackRow,
  type RowData,
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
  coreRowModel: createCoreRowModel(),
  sortedRowModel: createSortedRowModel(),
});

type Features = typeof FEATURES;

export type TableColumn<TData extends RowData> = ColumnDef<Features, TData>;
export type TableInstance<TData extends RowData> = SolidTable<Features, TData>;
export type TableColumnHeader<TData extends RowData> = Header<Features, TData>;
export type TableDataRow<TData extends RowData> = TanstackRow<Features, TData>;

export interface TableSort {
  columnId: string;
  desc: boolean;
}

function toSortingState(sort: TableSort | null): { id: string; desc: boolean }[] {
  return sort === null ? [] : [{ id: sort.columnId, desc: sort.desc }];
}

function fromSortingState(state: readonly { id: string; desc: boolean }[]): TableSort | null {
  const first = state[0];
  return first === undefined ? null : { columnId: first.id, desc: first.desc };
}

export type TableRootProps<TData extends RowData> = Omit<
  JSX.HTMLAttributes<HTMLTableElement>,
  "children"
> & {
  columns: readonly TableColumn<TData>[];
  data: readonly TData[];
  sorting?: TableSort | null;
  defaultSorting?: TableSort | null;
  onSortingChange?: (next: TableSort | null) => void;
  children?: (table: TableInstance<TData>) => JSX.Element;
};

export function TableRoot<TData extends RowData>(props: TableRootProps<TData>) {
  traceLife("ui.table");

  const [uncontrolledSorting, setUncontrolledSorting] =
    createSignal<TableSort | null>(props.defaultSorting ?? null);
  const sorting = (): TableSort | null =>
    props.sorting !== undefined ? props.sorting : uncontrolledSorting();
  const setSorting = (next: TableSort | null): void => {
    if (props.sorting === undefined) setUncontrolledSorting(next);
    props.onSortingChange?.(next);
  };

  const table = createTable<Features, TData>({
    features: FEATURES,
    get data() {
      return props.data as TData[];
    },
    get columns() {
      return props.columns as ColumnDef<Features, TData>[];
    },
    enableMultiSort: false,
    get state() {
      return { sorting: toSortingState(sorting()) };
    },
    onSortingChange: (updater) => {
      const current = toSortingState(sorting());
      const next = typeof updater === "function" ? updater(current) : updater;
      setSorting(fromSortingState(next));
    },
  }) as TableInstance<TData>;

  const [local, rest] = splitProps(props, [
    "columns",
    "data",
    "sorting",
    "defaultSorting",
    "onSortingChange",
    "children",
  ]);

  return (
    <table {...dropAddress(rest)} {...anatomyParts.root.attrs}>
      {local.children ? local.children(table) : <DefaultTableBody table={table} />}
    </table>
  );
}
