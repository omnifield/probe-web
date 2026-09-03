import type { RowData } from "@tanstack/solid-table";
import { For, type JSX } from "solid-js";

import { TableBody } from "./body.js";
import { TableCell } from "./cell.js";
import { TableHead } from "./head.js";
import { TableHeadRow } from "./head-row.js";
import { TableHeaderCell } from "./header-cell.js";
import { TableHeaderSortTrigger } from "./header-sort-trigger.js";
import { TableRow } from "./row.js";
import type { TableColumnHeader, TableInstance } from "./root.js";

function defaultHeaderText<TData extends RowData>(header: TableColumnHeader<TData>): string {
  const declared = header.column.columnDef.header;
  return typeof declared === "string" ? declared : header.column.id;
}

export function DefaultTableBody<TData extends RowData>(props: {
  table: TableInstance<TData>;
}): JSX.Element {
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
              <For each={row.getAllCells()}>
                {(cell) => <TableCell>{String(cell.getValue())}</TableCell>}
              </For>
            </TableRow>
          )}
        </For>
      </TableBody>
    </>
  );
}
