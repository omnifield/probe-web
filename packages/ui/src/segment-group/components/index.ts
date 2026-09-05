export { SegmentGroup, type SegmentGroupProps } from "./root.js";
export { SegmentGroupLabel, type SegmentGroupLabelProps } from "./label.js";
export { SegmentGroupIndicator, type SegmentGroupIndicatorProps } from "./indicator.js";
export { SegmentGroupItem, type SegmentGroupItemProps } from "./item/index.js";
export { SegmentGroupItemControl, type SegmentGroupItemControlProps } from "./item/control.js";
export { SegmentGroupItemText, type SegmentGroupItemTextProps } from "./item/text.js";
export {
  SegmentGroupItemHiddenInput,
  type SegmentGroupItemHiddenInputProps,
} from "./item/hidden-input.js";

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { SegmentGroup } from "./root.js";
import { SegmentGroupLabel } from "./label.js";
import { SegmentGroupIndicator } from "./indicator.js";
import { SegmentGroupItem } from "./item/index.js";
import { SegmentGroupItemControl } from "./item/control.js";
import { SegmentGroupItemText } from "./item/text.js";

export const kit = defineKitComponent(passport, {
  root: SegmentGroup,
  label: SegmentGroupLabel,
  indicator: SegmentGroupIndicator,
  item: SegmentGroupItem,
  itemControl: SegmentGroupItemControl,
  itemText: SegmentGroupItemText,
});
