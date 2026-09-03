import type { RowData } from "@tanstack/solid-table";
import { splitProps, type JSX } from "solid-js";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";
import { anatomyParts } from "../entity/anatomy.js";
import type { TableDataRow } from "./root.js";

export type TableRowSelectTriggerProps<TData extends RowData> = Omit<
  JSX.InputHTMLAttributes<HTMLInputElement>,
  "type" | "checked" | "onClick"
> & {
  row: TableDataRow<TData>;
};

export function TableRowSelectTrigger<TData extends RowData>(
  props: TableRowSelectTriggerProps<TData>,
) {
  traceLife("ui.table-row-select-trigger");

  const [, rest] = splitProps(props, ["row"]);

  return (
    <input
      type="checkbox"
      checked={props.row.getIsSelected()}
      disabled={!props.row.getCanSelect()}
      {...dropAddress(rest)}
      onClick={(event) => props.row.getToggleSelectedHandler()(event)}
      {...anatomyParts.rowSelectTrigger.attrs}
    />
  );
}
