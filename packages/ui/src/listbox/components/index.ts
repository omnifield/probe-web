export { Listbox, type ListboxProps } from "./root.js";
export { ListboxLabel, type ListboxLabelProps } from "./label.js";
export { ListboxInput, type ListboxInputProps } from "./input.js";
export { ListboxContent, type ListboxContentProps } from "./content.js";
export { ListboxItemGroup, type ListboxItemGroupProps } from "./item-group/index.js";
export { ListboxItemGroupLabel, type ListboxItemGroupLabelProps } from "./item-group/label.js";
export { ListboxItem, type ListboxItemProps } from "./item/index.js";
export { ListboxItemText, type ListboxItemTextProps } from "./item/text.js";
export { ListboxItemIndicator, type ListboxItemIndicatorProps } from "./item/indicator.js";
export { ListboxValueText, type ListboxValueTextProps } from "./value-text.js";
export { ListboxEmpty, type ListboxEmptyProps } from "./empty.js";

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { Listbox } from "./root.js";
import { ListboxLabel } from "./label.js";
import { ListboxInput } from "./input.js";
import { ListboxContent } from "./content.js";
import { ListboxItemGroup } from "./item-group/index.js";
import { ListboxItemGroupLabel } from "./item-group/label.js";
import { ListboxItem } from "./item/index.js";
import { ListboxItemText } from "./item/text.js";
import { ListboxItemIndicator } from "./item/indicator.js";
import { ListboxValueText } from "./value-text.js";
import { ListboxEmpty } from "./empty.js";

export const kit = defineKitComponent(passport, {
  root: Listbox,
  label: ListboxLabel,
  input: ListboxInput,
  content: ListboxContent,
  item: ListboxItem,
  itemText: ListboxItemText,
  itemIndicator: ListboxItemIndicator,
  itemGroup: ListboxItemGroup,
  itemGroupLabel: ListboxItemGroupLabel,
  valueText: ListboxValueText,
  empty: ListboxEmpty,
});
