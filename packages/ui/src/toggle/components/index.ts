export { Toggle, type ToggleProps } from "./root.js";
export { ToggleIndicator, type ToggleIndicatorProps } from "./indicator.js";

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { Toggle } from "./root.js";
import { ToggleIndicator } from "./indicator.js";

export const kit = defineKitComponent(passport, {
  root: Toggle,
  indicator: ToggleIndicator,
});
