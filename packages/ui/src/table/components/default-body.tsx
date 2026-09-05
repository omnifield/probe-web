import type { RowData } from "@tanstack/solid-table";
import { For, Show, type JSX } from "solid-js";

import { TableBody } from "./body.js";
import { TableCell } from "./cell.js";
import { TableHead } from "./head.js";
import { TableHeadRow } from "./head-row.js";
import { TableHeaderCell } from "./header-cell.js";
import { TableHeaderSelectTrigger } from "./header-select-trigger.js";
import { TableHeaderSortTrigger } from "./header-sort-trigger.js";
import { TableRow } from "./row.js";
import { TableRowSelectTrigger } from "./row-select-trigger.js";
import type { TableColumnHeader, TableInstance } from "./root.js";

function defaultHeaderText<TData extends RowData>(header: TableColumnHeader<TData>): string {
  const declared = header.column.columnDef.header;
  const label = typeof declared === "string" ? declared : header.column.id;
  const index = header.column.getSortIndex();
  return index < 0 ? label : `${label} (${index + 1})`;
}

export function DefaultTableBody<TData extends RowData>(props: {
  table: TableInstance<TData>;
}): JSX.Element {
  const rowSelectionEnabled = () => Boolean(props.table.options.enableRowSelection);

  return (
    <>
      <TableHead>
        <TableHeadRow>
          <Show when={rowSelectionEnabled()}>
            <TableHeaderCell>
              <TableHeaderSelectTrigger table={props.table} />
            </TableHeaderCell>
          </Show>
          <For each={props.table.getStartLeafHeaders()}>
            {(header) => (
              <TableHeaderCell header={header}>
                <TableHeaderSortTrigger header={header}>
                  {defaultHeaderText(header)}
                </TableHeaderSortTrigger>
              </TableHeaderCell>
            )}
          </For>
          <For each={props.table.getCenterLeafHeaders()}>
            {(header) => (
              <TableHeaderCell header={header}>
                <TableHeaderSortTrigger header={header}>
                  {defaultHeaderText(header)}
                </TableHeaderSortTrigger>
              </TableHeaderCell>
            )}
          </For>
          <For each={props.table.getEndLeafHeaders()}>
            {(header) => (
              <TableHeaderCell header={header}>
                <TableHeaderSortTrigger header={header}>
                  {defaultHeaderText(header)}
                </TableHeaderSortTrigger>
              </TableHeaderCell>
            )}
          </For>
        </TableHeadRow>
      </TableHead>
      <TableBody>
        <For each={props.table.getRowModel().rows}>
          {(row) => (
            <TableRow row={row}>
              <Show when={rowSelectionEnabled()}>
                <TableCell>
                  <TableRowSelectTrigger row={row} />
                </TableCell>
              </Show>
              <For each={row.getStartVisibleCells()}>
                {(cell) => <TableCell cell={cell}>{String(cell.getValue())}</TableCell>}
              </For>
              <For each={row.getCenterVisibleCells()}>
                {(cell) => <TableCell cell={cell}>{String(cell.getValue())}</TableCell>}
              </For>
              <For each={row.getEndVisibleCells()}>
                {(cell) => <TableCell cell={cell}>{String(cell.getValue())}</TableCell>}
              </For>
            </TableRow>
          )}
        </For>
      </TableBody>
    </>
  );
}
