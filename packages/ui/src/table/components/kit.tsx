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
import { createSignal, For, splitProps, type JSX } from "solid-js";

import { dropAddress } from "../../utils/slot-chain.js";
import { traceLife } from "../../utils/trace.js";
import { anatomyParts } from "../entity/anatomy.js";

// Table — the kit's first OWN compound component (`../entity/anatomy.ts`): no Ark UI, no Zag
// machine underneath. DOM, address, and the sort-toggle behavior are hand-authored here, the
// same standing the button's own zero-part interactivity has. Row ORDERING, though, is not
// hand-rolled: it is `@tanstack/solid-table` (core + sorted row models only) — the same
// market-vetted engine `products/tables`' own (much larger) `DataTable` already stands on
// (`@tanstack/solid-table@9.1.2`, checked live in this repo, 2026-08-26). Sorting a list
// correctly — stable order, a real comparator per column — is a solved problem, not one this
// kit reinvents; everything ELSE that engine can do (grouping, pinning, pagination, selection)
// is left switched off, v1's agreed scope (2026-08-26, user: "погнали" on exactly this cut).
//
// TanStack v9 tables are Store-backed, not wrapped in a Solid `Accessor`: reading
// `table.getRowModel()` inside JSX already participates in Solid's fine-grained reactivity
// without an extra `()` — `createTable`'s own doc comment names this directly. `TableRoot`
// hands the live table to a CUSTOM `children` as a plain value via a RENDER PROP, not through a
// context hook: the rest of the kit's Ark-based components don't expose one either (nothing has
// needed it yet), and a render prop keeps row/column iteration in the consumer's own `<For>`,
// the same "kit gives parts, consumer writes the loop" shape every other compound component
// already has (`<TabsList><For each={tabs}>...`).
//
// `children` IS OPTIONAL, and that is not a shortcut — it is the second real caller this
// component has. The assembly-tree previewer (`packages/assembly/src/render.tsx`) hands every
// node's `children` prop an ALREADY-RENDERED subtree, uniformly, for every component in the kit
// (`PWEB-83` — deliberately no per-component special case there, the file header names the
// pain that invariant fixed). A render-prop FUNCTION cannot arrive through that path; a assembly
// wanting to preview a table for real, the same way it previews a real live `Accordion`/`Tabs`,
// cannot supply one. Omitting `children` therefore renders a DEFAULT structure — head, one row
// per `data` entry, cells in column order — built from the SAME live `table` a custom render
// prop would receive, so sorting is genuinely live in that default too, not a static mock. A
// hand-written consumer needing custom cell content still passes `children` and gets full
// control, unchanged from before.
//
// Props are split with Solid's own `splitProps`, never destructured plainly — a plain
// `const { columns, ...rest } = props` would read every field ONCE at setup and freeze it,
// the standard Solid reactivity pitfall; `splitProps` keeps each field a tracked access.

const FEATURES = tableFeatures({
  rowSortingFeature,
  coreRowModel: createCoreRowModel(),
  sortedRowModel: createSortedRowModel(),
});

type Features = typeof FEATURES;

/** A column definition — TanStack's own type, fixed to this table's (small) feature set. */
export type TableColumn<TData extends RowData> = ColumnDef<Features, TData>;
/** The live table instance `TableRoot` hands its children — reading it drives everything else. */
export type TableInstance<TData extends RowData> = SolidTable<Features, TData>;
/** One column's header, as handed to `TableHeaderCell`/`TableHeaderSortTrigger`. */
export type TableColumnHeader<TData extends RowData> = Header<Features, TData>;
/** One data row, as TanStack computes it — what a `<For>` over `table.getRowModel().rows` yields. */
export type TableDataRow<TData extends RowData> = TanstackRow<Features, TData>;

/** The table's sort — ONE column at a time; v1 has no multi-sort (`enableMultiSort: false` below). */
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
  /** Controlled sort. Leave `undefined` (not `null`) to let the table hold its own. */
  sorting?: TableSort | null;
  /** Starting sort for the UNCONTROLLED case — ignored once `sorting` is passed. */
  defaultSorting?: TableSort | null;
  onSortingChange?: (next: TableSort | null) => void;
  /**
   * Render prop for full control over the loop. Omitted — the default structure renders instead
   * (file header: "the second real caller"), from the same live `table`.
   */
  children?: (table: TableInstance<TData>) => JSX.Element;
};

/** What the default structure (no `children` given) uses for a column's visible header text. */
function defaultHeaderText<TData extends RowData>(header: TableColumnHeader<TData>): string {
  const declared = header.column.columnDef.header;
  return typeof declared === "string" ? declared : header.column.id;
}

/**
 * The default structure: one header row, one data row per `data` entry, cells in column order —
 * exactly what the doc example below writes by hand, built here so a table addressed by an
 * assembly tree (which can only ever hand a node plain props, never a function, `PWEB-83`) has a
 * working shape with a single `root` node and no children of its own.
 */
function DefaultTableBody<TData extends RowData>(props: { table: TableInstance<TData> }): JSX.Element {
  return (
    <>
      <TableHead>
        <For each={props.table.getHeaderGroups()}>
          {(group) => (
            <TableHeadRow>
              <For each={group.headers}>
                {(header) => (
                  <TableHeaderCell header={header}>
                    <TableHeaderSortTrigger header={header}>
                      {defaultHeaderText(header)}
                    </TableHeaderSortTrigger>
                  </TableHeaderCell>
                )}
              </For>
            </TableHeadRow>
          )}
        </For>
      </TableHead>
      <TableBody>
        <For each={props.table.getRowModel().rows}>
          {(row) => (
            <TableRow>
              <For each={row.getAllCells()}>{(cell) => <TableCell>{String(cell.getValue())}</TableCell>}</For>
            </TableRow>
          )}
        </For>
      </TableBody>
    </>
  );
}

/**
 * The table's root — owns the TanStack instance (columns, data, sort) and renders `<table>`.
 *
 * @example
 * ```tsx
 * <TableRoot columns={columns} data={people} defaultSorting={{ columnId: "name", desc: false }}>
 *   {(table) => (
 *     <>
 *       <TableHead>
 *         <For each={table.getHeaderGroups()}>
 *           {(group) => (
 *             <TableHeadRow>
 *               <For each={group.headers}>
 *                 {(header) => (
 *                   <TableHeaderCell header={header}>
 *                     <TableHeaderSortTrigger header={header}>
 *                       {String(header.column.columnDef.header)}
 *                     </TableHeaderSortTrigger>
 *                   </TableHeaderCell>
 *                 )}
 *               </For>
 *             </TableHeadRow>
 *           )}
 *         </For>
 *       </TableHead>
 *       <TableBody>
 *         <For each={table.getRowModel().rows}>
 *           {(row) => (
 *             <TableRow>
 *               <For each={row.getAllCells()}>
 *                 {(cell) => <TableCell>{String(cell.getValue())}</TableCell>}
 *               </For>
 *             </TableRow>
 *           )}
 *         </For>
 *       </TableBody>
 *     </>
 *   )}
 * </TableRoot>
 * ```
 *
 * Or, for the default structure — same result as the hand-written example above, minus custom
 * cell content:
 *
 * ```tsx
 * <TableRoot columns={columns} data={people} defaultSorting={{ columnId: "name", desc: false }} />
 * ```
 */
export function TableRoot<TData extends RowData>(props: TableRootProps<TData>) {
  traceLife("ui.table");

  const [uncontrolledSorting, setUncontrolledSorting] = createSignal<TableSort | null>(
    props.defaultSorting ?? null,
  );
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

export type TableCaptionProps = JSX.HTMLAttributes<HTMLTableCaptionElement>;

/** The table's own caption — ONE node, `<caption>`. */
export function TableCaption(props: TableCaptionProps) {
  traceLife("ui.table-caption");

  return <caption {...dropAddress(props)} {...anatomyParts.caption.attrs} />;
}

export type TableHeadProps = JSX.HTMLAttributes<HTMLTableSectionElement>;

/** Wraps the header rows — ONE node, `<thead>`. */
export function TableHead(props: TableHeadProps) {
  traceLife("ui.table-head");

  return <thead {...dropAddress(props)} {...anatomyParts.head.attrs} />;
}

export type TableHeadRowProps = JSX.HTMLAttributes<HTMLTableRowElement>;

/** One row of header cells — ONE node, `<tr>`. */
export function TableHeadRow(props: TableHeadRowProps) {
  traceLife("ui.table-head-row");

  return <tr {...dropAddress(props)} {...anatomyParts.headRow.attrs} />;
}

export type TableHeaderCellProps<TData extends RowData> = Omit<
  JSX.ThHTMLAttributes<HTMLTableCellElement>,
  "children"
> & {
  /** The column's header, from `headerGroup.headers` — read for `aria-sort`/`data-state` only. */
  header: TableColumnHeader<TData>;
  children?: JSX.Element;
};

/**
 * One column's header cell — ONE node, `<th scope="col">`.
 *
 * Carries `aria-sort`/`data-state` for whichever column `header` names — per the WAI-ARIA
 * `columnheader` role, `aria-sort` belongs HERE, not on the button inside it
 * (`TableHeaderSortTrigger`). A column that cannot sort (`header.column.getCanSort()` false)
 * gets neither attribute: `aria-sort="none"` on every column, sortable or not, would claim a
 * capability that is not there.
 */
export function TableHeaderCell<TData extends RowData>(props: TableHeaderCellProps<TData>) {
  traceLife("ui.table-header-cell");

  const state = (): "ascending" | "descending" | "none" | undefined => {
    if (!props.header.column.getCanSort()) return undefined;
    const sorted = props.header.column.getIsSorted();
    return sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none";
  };

  const [, rest] = splitProps(props, ["header"]);

  return (
    <th
      scope="col"
      {...dropAddress(rest)}
      aria-sort={state()}
      data-state={state()}
      {...anatomyParts.headerCell.attrs}
    />
  );
}

export type TableHeaderSortTriggerProps<TData extends RowData> = Omit<
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  "type" | "onClick"
> & {
  header: TableColumnHeader<TData>;
};

/**
 * The button that toggles a column's sort — a REAL `<button>`, a separate part from
 * `TableHeaderCell` on purpose (the file header explains why). Carries the same `data-state` as
 * its header cell, so a skin can style an arrow's direction on the button itself without an
 * ancestor selector; `hover`/`active`/`focus-visible` are genuine pseudo-classes — no JS pointer
 * tracking here, the same reasoning the plain button and the toggle group's own item apply.
 */
export function TableHeaderSortTrigger<TData extends RowData>(
  props: TableHeaderSortTriggerProps<TData>,
) {
  traceLife("ui.table-header-sort-trigger");

  const state = (): "ascending" | "descending" | "none" => {
    const sorted = props.header.column.getIsSorted();
    return sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none";
  };

  const [, rest] = splitProps(props, ["header"]);

  return (
    <button
      type="button"
      disabled={!props.header.column.getCanSort()}
      {...dropAddress(rest)}
      data-state={state()}
      onClick={(event) => props.header.column.getToggleSortingHandler()?.(event)}
      {...anatomyParts.headerSortTrigger.attrs}
    />
  );
}

export type TableBodyProps = JSX.HTMLAttributes<HTMLTableSectionElement>;

/** Wraps the data rows — ONE node, `<tbody>`. */
export function TableBody(props: TableBodyProps) {
  traceLife("ui.table-body");

  return <tbody {...dropAddress(props)} {...anatomyParts.body.attrs} />;
}

export type TableRowProps = JSX.HTMLAttributes<HTMLTableRowElement>;

/** One data row — ONE node, `<tr>`. No row-level state in v1 — no selection, no pinning. */
export function TableRow(props: TableRowProps) {
  traceLife("ui.table-row");

  return <tr {...dropAddress(props)} {...anatomyParts.row.attrs} />;
}

export type TableCellProps = JSX.TdHTMLAttributes<HTMLTableCellElement>;

/** One cell — ONE node, `<td>`. Content is the consumer's, same as every other kit part. */
export function TableCell(props: TableCellProps) {
  traceLife("ui.table-cell");

  return <td {...dropAddress(props)} {...anatomyParts.cell.attrs} />;
}

// MAP of the table: passport part → the component that draws it (`PWEB-84`).
//
// `TableHeaderSortTrigger` is generic over `TData` (`../components/index.tsx`) but `KitComponent`
// wants a plain `PartComponent` — the map is read-only structural wiring (which function draws
// which part), never instantiated with a concrete `TData` here, so the cast is to the map's own
// shape, not a claim about what the component accepts.

import { defineKitComponent, type PartComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";

/** The table's passport together with whatever draws each of its nine parts. */
export const kit = defineKitComponent(passport, {
  root: TableRoot as PartComponent,
  caption: TableCaption,
  head: TableHead,
  headRow: TableHeadRow,
  headerCell: TableHeaderCell as PartComponent,
  headerSortTrigger: TableHeaderSortTrigger as PartComponent,
  body: TableBody,
  row: TableRow,
  cell: TableCell,
});
