import type { JSX } from "solid-js";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";
import { anatomyParts } from "../entity/anatomy.js";

export type TableHeadRowProps = JSX.HTMLAttributes<HTMLTableRowElement>;

export function TableHeadRow(props: TableHeadRowProps) {
  traceLife("ui.table-head-row");

  return <tr {...dropAddress(props)} {...anatomyParts.headRow.attrs} />;
}
