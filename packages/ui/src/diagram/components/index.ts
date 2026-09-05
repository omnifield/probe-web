export { DiagramRoot, type DiagramRootProps } from "./root.js";
export {
  DiagramAxis,
  type DiagramAxisOrientation,
  type DiagramAxisProps,
} from "./cartesian/axis.js";
export { DiagramGrid, type DiagramGridProps } from "./cartesian/grid.js";
export { DiagramLine, type DiagramLineProps } from "./cartesian/line.js";
export { DiagramArea, type DiagramAreaProps } from "./cartesian/area.js";
export { DiagramBar, type DiagramBarProps } from "./cartesian/bar.js";
export { DiagramPoint, type DiagramPointProps } from "./cartesian/point.js";

import { defineKitComponent, type PartComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { DiagramRoot } from "./root.js";
import { DiagramAxis } from "./cartesian/axis.js";
import { DiagramGrid } from "./cartesian/grid.js";
import { DiagramLine } from "./cartesian/line.js";
import { DiagramArea } from "./cartesian/area.js";
import { DiagramBar } from "./cartesian/bar.js";
import { DiagramPoint } from "./cartesian/point.js";

export const kit = defineKitComponent(passport, {
  root: DiagramRoot as PartComponent,
  axis: DiagramAxis as PartComponent,
  grid: DiagramGrid as PartComponent,
  line: DiagramLine as PartComponent,
  area: DiagramArea as PartComponent,
  bar: DiagramBar as PartComponent,
  point: DiagramPoint as PartComponent,
});
