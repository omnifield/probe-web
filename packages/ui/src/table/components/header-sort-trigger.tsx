import type { RowData } from "@tanstack/solid-table";
import { splitProps, type JSX } from "solid-js";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";
import { anatomyParts } from "../entity/anatomy.js";
import type { TableColumnHeader } from "./root.js";

export type TableHeaderSortTriggerProps<TData extends RowData> = Omit<
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  "type" | "onClick"
> & {
  header: TableColumnHeader<TData>;
};

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
