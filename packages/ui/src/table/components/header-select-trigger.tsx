import type { RowData } from "@tanstack/solid-table";
import { createEffect, splitProps, type JSX } from "solid-js";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";
import { anatomyParts } from "../entity/anatomy.js";
import type { TableInstance } from "./root.js";

export type TableHeaderSelectTriggerProps<TData extends RowData> = Omit<
  JSX.InputHTMLAttributes<HTMLInputElement>,
  "type" | "checked" | "onClick"
> & {
  table: TableInstance<TData>;
};

export function TableHeaderSelectTrigger<TData extends RowData>(
  props: TableHeaderSelectTriggerProps<TData>,
) {
  traceLife("ui.table-header-select-trigger");

  const [, rest] = splitProps(props, ["table"]);

  let element: HTMLInputElement | undefined;

  // `indeterminate` — свойство DOM, не HTML-атрибут, JSX его не типизирует вовсе (тот же
  // разрыв, что у любого фреймворка) — выставляется вручную через ref, реактивно.
  createEffect(() => {
    if (!element) return;
    element.indeterminate = props.table.getIsSomeRowsSelected() && !props.table.getIsAllRowsSelected();
  });

  return (
    <input
      ref={element}
      type="checkbox"
      checked={props.table.getIsAllRowsSelected()}
      {...dropAddress(rest)}
      onClick={(event) => props.table.getToggleAllRowsSelectedHandler()(event)}
      {...anatomyParts.headerSelectTrigger.attrs}
    />
  );
}
