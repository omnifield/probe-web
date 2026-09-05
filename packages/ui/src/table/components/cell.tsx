import type { RowData } from "@tanstack/solid-table";
import { splitProps, type JSX } from "solid-js";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";
import { anatomyParts } from "../entity/anatomy.js";
import type { TableDataCell } from "./root.js";

export type TableCellProps<TData extends RowData = RowData> = JSX.TdHTMLAttributes<HTMLTableCellElement> & {
  /** Не задан — часть остаётся чистой структурой, без `data-pinned` (например, чекбокс-колонка выбора). */
  cell?: TableDataCell<TData>;
};

export function TableCell<TData extends RowData = RowData>(props: TableCellProps<TData>) {
  traceLife("ui.table-cell");

  const pinned = (): "start" | "end" | undefined => {
    const side = props.cell?.column.getIsPinned();
    return side === false || side === undefined ? undefined : side;
  };

  const [, rest] = splitProps(props, ["cell"]);

  return <td {...dropAddress(rest)} data-pinned={pinned()} {...anatomyParts.cell.attrs} />;
}
