import type { RowData } from "@tanstack/solid-table";
import { splitProps, type JSX } from "solid-js";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";
import { anatomyParts } from "../entity/anatomy.js";
import type { TableDataRow } from "./root.js";

export type TableRowProps<TData extends RowData = RowData> = JSX.HTMLAttributes<HTMLTableRowElement> & {
  /** Задан — `row` несёт `data-selected` по `row.getIsSelected()`. Не задан — часть остаётся чистой структурой. */
  row?: TableDataRow<TData>;
};

export function TableRow<TData extends RowData = RowData>(props: TableRowProps<TData>) {
  traceLife("ui.table-row");

  const [local, rest] = splitProps(props, ["row"]);

  return (
    <tr
      {...dropAddress(rest)}
      data-selected={local.row?.getIsSelected() ? "" : undefined}
      {...anatomyParts.row.attrs}
    />
  );
}
