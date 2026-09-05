export { RadioGroup, type RadioGroupProps } from "./root.js";
export { RadioGroupLabel, type RadioGroupLabelProps } from "./label.js";
export { RadioGroupIndicator, type RadioGroupIndicatorProps } from "./indicator.js";
export { RadioGroupItem, type RadioGroupItemProps } from "./item/index.js";
export { RadioGroupItemControl, type RadioGroupItemControlProps } from "./item/control.js";
export { RadioGroupItemText, type RadioGroupItemTextProps } from "./item/text.js";
export { RadioGroupItemHiddenInput, type RadioGroupItemHiddenInputProps } from "./item/hidden-input.js";

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { RadioGroup } from "./root.js";
import { RadioGroupLabel } from "./label.js";
import { RadioGroupIndicator } from "./indicator.js";
import { RadioGroupItem } from "./item/index.js";
import { RadioGroupItemControl } from "./item/control.js";
import { RadioGroupItemText } from "./item/text.js";

export const kit = defineKitComponent(passport, {
  root: RadioGroup,
  label: RadioGroupLabel,
  indicator: RadioGroupIndicator,
  item: RadioGroupItem,
  itemControl: RadioGroupItemControl,
  itemText: RadioGroupItemText,
});
