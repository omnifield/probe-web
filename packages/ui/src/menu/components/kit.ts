// MAP of the menu: passport part → the component that draws it (`PWEB-84`).
//
// `Menu` (the root) is not in `parts`: it carries no anatomy part at all (`../entity/anatomy.ts`),
// and `parts`' keys are checked against anatomy parts, not against every rendered component. It is
// the passport's `provider` instead (`PWEB-153`, same device as the popover's own `kit.ts`): the
// invisible context that `positioner` (the passport's chosen stand-in root) needs to read.
// `MenuCheckboxItem`/`MenuRadioItem`/`MenuRadioItemGroup` are absent for the same structural
// reason: they draw with `item`'s/`itemGroup`'s own addresses, not new ones — the map already
// names `item`/`itemGroup` once, and a second entry for the same coordinate would say nothing new.

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import {
  Menu,
  MenuArrow,
  MenuArrowTip,
  MenuContent,
  MenuContextTrigger,
  MenuIndicator,
  MenuItem,
  MenuItemGroup,
  MenuItemGroupLabel,
  MenuItemIndicator,
  MenuItemText,
  MenuPositioner,
  MenuSeparator,
  MenuTrigger,
  MenuTriggerItem,
} from "./index.jsx";

/** The menu's passport together with whatever draws each of its fourteen parts. */
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
  undefined,
  Menu,
);
