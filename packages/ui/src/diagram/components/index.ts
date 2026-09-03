export { DiagramRoot, type DiagramRootProps } from "./root.js";

import { defineKitComponent, type PartComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { DiagramRoot } from "./root.js";

export const kit = defineKitComponent(passport, {
  root: DiagramRoot as PartComponent,
});
