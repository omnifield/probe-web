export { Select, type SelectProps } from "./root.js";
export { SelectLabel, type SelectLabelProps } from "./label.js";
export { SelectControl, type SelectControlProps } from "./control.js";
export { SelectTrigger, type SelectTriggerProps } from "./trigger.js";
export { SelectValueText, type SelectValueTextProps } from "./value-text.js";
export { SelectClearTrigger, type SelectClearTriggerProps } from "./clear-trigger.js";
export { SelectIndicator, type SelectIndicatorProps } from "./indicator.js";
export { SelectPositioner, type SelectPositionerProps } from "./positioner.js";
export { SelectContent, type SelectContentProps } from "./content.js";
export { SelectList, type SelectListProps } from "./list.js";
export { SelectItemGroup, type SelectItemGroupProps } from "./item-group/index.js";
export { SelectItemGroupLabel, type SelectItemGroupLabelProps } from "./item-group/label.js";
export { SelectItem, type SelectItemProps } from "./item/index.js";
export { SelectItemText, type SelectItemTextProps } from "./item/text.js";
export { SelectItemIndicator, type SelectItemIndicatorProps } from "./item/indicator.js";
export { SelectHiddenSelect, type SelectHiddenSelectProps } from "./hidden-select.js";

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { Select } from "./root.js";
import { SelectLabel } from "./label.js";
import { SelectControl } from "./control.js";
import { SelectTrigger } from "./trigger.js";
import { SelectValueText } from "./value-text.js";
import { SelectClearTrigger } from "./clear-trigger.js";
import { SelectIndicator } from "./indicator.js";
import { SelectPositioner } from "./positioner.js";
import { SelectContent } from "./content.js";
import { SelectList } from "./list.js";
import { SelectItemGroup } from "./item-group/index.js";
import { SelectItemGroupLabel } from "./item-group/label.js";
import { SelectItem } from "./item/index.js";
import { SelectItemText } from "./item/text.js";
import { SelectItemIndicator } from "./item/indicator.js";

export const kit = defineKitComponent(passport, {
  root: Select,
  label: SelectLabel,
  control: SelectControl,
  trigger: SelectTrigger,
  valueText: SelectValueText,
  clearTrigger: SelectClearTrigger,
  indicator: SelectIndicator,
  positioner: SelectPositioner,
  content: SelectContent,
  list: SelectList,
  itemGroup: SelectItemGroup,
  itemGroupLabel: SelectItemGroupLabel,
  item: SelectItem,
  itemText: SelectItemText,
  itemIndicator: SelectItemIndicator,
});
