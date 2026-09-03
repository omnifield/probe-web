import type { JSX } from "solid-js";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";
import { anatomyParts } from "../entity/anatomy.js";

export type TableCellProps = JSX.TdHTMLAttributes<HTMLTableCellElement>;

export function TableCell(props: TableCellProps) {
  traceLife("ui.table-cell");

  return <td {...dropAddress(props)} {...anatomyParts.cell.attrs} />;
}
