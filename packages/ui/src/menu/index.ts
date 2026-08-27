// What leaves this folder outward.
//
// Two different things, two different readers: MARKUP is picked up by the primitives entry
// (`src/index.ts`), the PASSPORT by the `./passport` build, which walks folders and assembles the
// list itself.

export {
  Menu,
  MenuArrow,
  type MenuArrowProps,
  MenuArrowTip,
  type MenuArrowTipProps,
  MenuCheckboxItem,
  type MenuCheckboxItemProps,
  MenuContent,
  type MenuContentProps,
  MenuContextTrigger,
  type MenuContextTriggerProps,
  MenuIndicator,
  type MenuIndicatorProps,
  MenuItem,
  MenuItemGroup,
  type MenuItemGroupProps,
  MenuItemGroupLabel,
  type MenuItemGroupLabelProps,
  MenuItemIndicator,
  type MenuItemIndicatorProps,
  type MenuItemProps,
  MenuItemText,
  type MenuItemTextProps,
  MenuPositioner,
  type MenuPositionerProps,
  type MenuProps,
  MenuRadioItem,
  MenuRadioItemGroup,
  type MenuRadioItemGroupProps,
  type MenuRadioItemProps,
  MenuSeparator,
  type MenuSeparatorProps,
  MenuTrigger,
  MenuTriggerItem,
  type MenuTriggerItemProps,
  type MenuTriggerProps,
} from "./components/index.jsx";
export { kit } from "./components/kit.js";
export { anatomy, anatomyParts, passport } from "./entity";
