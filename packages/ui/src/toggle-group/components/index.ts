export { ToggleGroup, type ToggleGroupProps } from "./root.js";
export { ToggleGroupItem, type ToggleGroupItemProps } from "./item.js";

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { ToggleGroup } from "./root.js";
import { ToggleGroupItem } from "./item.js";

export const kit = defineKitComponent(passport, {
  root: ToggleGroup,
  item: ToggleGroupItem,
});
