export { Menu, type MenuProps } from "./root.js";
export { MenuTrigger, type MenuTriggerProps } from "./trigger.js";
export { MenuTriggerItem, type MenuTriggerItemProps } from "./trigger-item.js";
export { MenuContextTrigger, type MenuContextTriggerProps } from "./context-trigger.js";
export { MenuPositioner, type MenuPositionerProps } from "./positioner.js";
export { MenuContent, type MenuContentProps } from "./content.js";
export { MenuIndicator, type MenuIndicatorProps } from "./indicator.js";
export { MenuSeparator, type MenuSeparatorProps } from "./separator.js";
export { MenuArrow, type MenuArrowProps } from "./arrow/index.js";
export { MenuArrowTip, type MenuArrowTipProps } from "./arrow/tip.js";
export { MenuItemGroup, type MenuItemGroupProps } from "./item-group/index.js";
export { MenuItemGroupLabel, type MenuItemGroupLabelProps } from "./item-group/label.js";
export { MenuItem, type MenuItemProps } from "./item/index.js";
export { MenuCheckboxItem, type MenuCheckboxItemProps } from "./item/checkbox.js";
export { MenuRadioItem, type MenuRadioItemProps } from "./item/radio.js";
export { MenuRadioItemGroup, type MenuRadioItemGroupProps } from "./item/radio-group.js";
export { MenuItemIndicator, type MenuItemIndicatorProps } from "./item/indicator.js";
export { MenuItemText, type MenuItemTextProps } from "./item/text.js";

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { Menu } from "./root.js";
import { MenuTrigger } from "./trigger.js";
import { MenuTriggerItem } from "./trigger-item.js";
import { MenuContextTrigger } from "./context-trigger.js";
import { MenuPositioner } from "./positioner.js";
import { MenuContent } from "./content.js";
import { MenuIndicator } from "./indicator.js";
import { MenuSeparator } from "./separator.js";
import { MenuArrow } from "./arrow/index.js";
import { MenuArrowTip } from "./arrow/tip.js";
import { MenuItemGroup } from "./item-group/index.js";
import { MenuItemGroupLabel } from "./item-group/label.js";
import { MenuItem } from "./item/index.js";
import { MenuItemIndicator } from "./item/indicator.js";
import { MenuItemText } from "./item/text.js";

export const kit = defineKitComponent(
  passport,
  {
    arrow: MenuArrow,
    arrowTip: MenuArrowTip,
    positioner: MenuPositioner,
    content: MenuContent,
    indicator: MenuIndicator,
    trigger: MenuTrigger,
    triggerItem: MenuTriggerItem,
    contextTrigger: MenuContextTrigger,
    separator: MenuSeparator,
    itemGroup: MenuItemGroup,
    itemGroupLabel: MenuItemGroupLabel,
    item: MenuItem,
    itemIndicator: MenuItemIndicator,
    itemText: MenuItemText,
  },
  Menu,
);
