export { Flow, type FlowProps } from "./root.js";
export { FlowItem, type FlowItemProps } from "./item.js";

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { Flow } from "./root.js";
import { FlowItem } from "./item.js";

export const kit = defineKitComponent(passport, {
  root: Flow,
  item: FlowItem,
});
