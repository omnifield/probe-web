export { Checkbox, type CheckboxProps } from "./root.js";
export { CheckboxControl, type CheckboxControlProps } from "./control.js";
export { CheckboxIndicator, type CheckboxIndicatorProps } from "./indicator.js";
export { CheckboxLabel, type CheckboxLabelProps } from "./label.js";

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { Checkbox } from "./root.js";
import { CheckboxControl } from "./control.js";
import { CheckboxIndicator } from "./indicator.js";
import { CheckboxLabel } from "./label.js";

export const kit = defineKitComponent(passport, {
  root: Checkbox,
  control: CheckboxControl,
  indicator: CheckboxIndicator,
  label: CheckboxLabel,
});
