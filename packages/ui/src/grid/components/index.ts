export { Grid, type GridProps } from "./root.js";
export { GridCell, type GridCellProps } from "./cell.js";

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { Grid } from "./root.js";
import { GridCell } from "./cell.js";

export const kit = defineKitComponent(passport, {
  root: Grid,
  cell: GridCell,
});
