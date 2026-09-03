export {
  TableRoot,
  type TableRootProps,
  type TableColumn,
  type TableInstance,
  type TableColumnHeader,
  type TableDataRow,
  type TableSort,
  type TableRowSelection,
  type TableColumnVisibility,
  type TableColumnPinning,
  type TableDataCell,
  type TableColumnFilters,
} from "./root.js";
export { TableCaption, type TableCaptionProps } from "./caption.js";
export { TableHead, type TableHeadProps } from "./head.js";
export { TableHeadRow, type TableHeadRowProps } from "./head-row.js";
export { TableHeaderCell, type TableHeaderCellProps } from "./header-cell.js";
export {
  TableHeaderSortTrigger,
  type TableHeaderSortTriggerProps,
} from "./header-sort-trigger.js";
export {
  TableHeaderSelectTrigger,
  type TableHeaderSelectTriggerProps,
} from "./header-select-trigger.js";
export { TableBody, type TableBodyProps } from "./body.js";
export { TableRow, type TableRowProps } from "./row.js";
export { TableCell, type TableCellProps } from "./cell.js";
export {
  TableRowSelectTrigger,
  type TableRowSelectTriggerProps,
} from "./row-select-trigger.js";

import { defineKitComponent, type PartComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { TableRoot } from "./root.js";
import { TableCaption } from "./caption.js";
import { TableHead } from "./head.js";
import { TableHeadRow } from "./head-row.js";
import { TableHeaderCell } from "./header-cell.js";
import { TableHeaderSortTrigger } from "./header-sort-trigger.js";
import { TableHeaderSelectTrigger } from "./header-select-trigger.js";
import { TableBody } from "./body.js";
import { TableRow } from "./row.js";
import { TableCell } from "./cell.js";
import { TableRowSelectTrigger } from "./row-select-trigger.js";

export const kit = defineKitComponent(passport, {
  root: TableRoot as PartComponent,
  caption: TableCaption,
  head: TableHead,
  headRow: TableHeadRow,
  headerCell: TableHeaderCell as PartComponent,
  headerSortTrigger: TableHeaderSortTrigger as PartComponent,
  headerSelectTrigger: TableHeaderSelectTrigger as PartComponent,
  body: TableBody,
  row: TableRow as PartComponent,
  cell: TableCell,
  rowSelectTrigger: TableRowSelectTrigger as PartComponent,
});
