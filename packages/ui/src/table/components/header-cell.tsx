import type { RowData } from "@tanstack/solid-table";
import { splitProps, type JSX } from "solid-js";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";
import { anatomyParts } from "../entity/anatomy.js";
import type { TableColumnHeader } from "./root.js";

export type TableHeaderCellProps<TData extends RowData> = Omit<
  JSX.ThHTMLAttributes<HTMLTableCellElement>,
  "children"
> & {
  header: TableColumnHeader<TData>;
  children?: JSX.Element;
};

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
