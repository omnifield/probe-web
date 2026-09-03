export { DiagramRoot, type DiagramRootProps } from "./root.js";
export {
  DiagramAxis,
  type DiagramAxisOrientation,
  type DiagramAxisProps,
} from "./cartesian/axis.js";
export { DiagramGrid, type DiagramGridProps } from "./cartesian/grid.js";

import { defineKitComponent, type PartComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { DiagramRoot } from "./root.js";
import { DiagramAxis } from "./cartesian/axis.js";
import { DiagramGrid } from "./cartesian/grid.js";

export const kit = defineKitComponent(passport, {
  root: DiagramRoot as PartComponent,
  axis: DiagramAxis as PartComponent,
  grid: DiagramGrid as PartComponent,
});
