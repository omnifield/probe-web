// MAP of the table: passport part → the component that draws it (`PWEB-84`).
//
// `TableHeaderSortTrigger` is generic over `TData` (`../components/index.tsx`) but `KitComponent`
// wants a plain `PartComponent` — the map is read-only structural wiring (which function draws
// which part), never instantiated with a concrete `TData` here, so the cast is to the map's own
// shape, not a claim about what the component accepts.

import { defineKitComponent, type PartComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import {
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableHeaderSortTrigger,
  TableHeadRow,
  TableRoot,
  TableRow,
} from "./index.jsx";

/** The table's passport together with whatever draws each of its nine parts. */
export const kit = defineKitComponent(passport, {
  root: TableRoot as PartComponent,
  caption: TableCaption,
  head: TableHead,
  headRow: TableHeadRow,
  headerCell: TableHeaderCell as PartComponent,
  headerSortTrigger: TableHeaderSortTrigger as PartComponent,
  body: TableBody,
  row: TableRow,
  cell: TableCell,
});
