import type { JSX } from "solid-js";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";
import { anatomyParts } from "../entity/anatomy.js";

export type TableRowProps = JSX.HTMLAttributes<HTMLTableRowElement>;

export function TableRow(props: TableRowProps) {
  traceLife("ui.table-row");

  return <tr {...dropAddress(props)} {...anatomyParts.row.attrs} />;
}
