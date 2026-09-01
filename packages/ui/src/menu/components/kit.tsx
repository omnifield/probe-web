import {
  MenuArrow as ArkArrow,
  MenuArrowTip as ArkArrowTip,
  MenuCheckboxItem as ArkCheckboxItem,
  MenuContent as ArkContent,
  MenuContextTrigger as ArkContextTrigger,
  MenuIndicator as ArkIndicator,
  MenuItem as ArkItem,
  MenuItemGroup as ArkItemGroup,
  MenuItemGroupLabel as ArkItemGroupLabel,
  MenuItemIndicator as ArkItemIndicator,
  MenuItemText as ArkItemText,
  MenuPositioner as ArkPositioner,
  MenuRadioItem as ArkRadioItem,
  MenuRadioItemGroup as ArkRadioItemGroup,
  MenuRoot as ArkRoot,
  MenuSeparator as ArkSeparator,
  MenuTrigger as ArkTrigger,
  MenuTriggerItem as ArkTriggerItem,
  type MenuArrowProps as ArkArrowProps,
  type MenuArrowTipProps as ArkArrowTipProps,
  type MenuCheckboxItemProps as ArkCheckboxItemProps,
  type MenuContentProps as ArkContentProps,
  type MenuContextTriggerProps as ArkContextTriggerProps,
  type MenuIndicatorProps as ArkIndicatorProps,
  type MenuItemGroupLabelProps as ArkItemGroupLabelProps,
  type MenuItemGroupProps as ArkItemGroupProps,
  type MenuItemIndicatorProps as ArkItemIndicatorProps,
  type MenuItemProps as ArkItemProps,
  type MenuItemTextProps as ArkItemTextProps,
  type MenuPositionerProps as ArkPositionerProps,
  type MenuRadioItemGroupProps as ArkRadioItemGroupProps,
  type MenuRadioItemProps as ArkRadioItemProps,
  type MenuRootProps as ArkRootProps,
  type MenuSeparatorProps as ArkSeparatorProps,
  type MenuTriggerItemProps as ArkTriggerItemProps,
  type MenuTriggerProps as ArkTriggerProps,
} from "@ark-ui/solid/menu";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

// Menu — a floating list of actions, with plain, checkbox, and radio items, from Ark
// (`ark-ui.com/docs/components/menu`).
//
// Same device as the rest of the Ark-provided kit: anatomy is Ark's (re-exported straight from
// `@zag-js/menu`, `../entity/anatomy.ts`), the address is set by Ark itself (spreads
// `parts.*.attrs` inside every `getXxxProps()`, `menu.connect.mjs`), wrappers are thin,
// `dropAddress` strips any address arriving from OUTSIDE so a node never lies about what it is
// (`PWEB-46`).
//
// `MenuCheckboxItem`/`MenuRadioItem`/`MenuRadioItemGroup` are wrapped too, even though they draw
// with `item`'s/`itemGroup`'s own addresses, not new ones (`../entity/anatomy.ts` explains why):
// they are the ergonomic way most consumers reach for a checkbox/radio menu item, and the kit
// wraps every real component Ark ships, not only the ones that happen to introduce a new part.

/** Props of `Menu` — the root. Renders NO node — pure context, the same situation the popover's/dialog's/drawer's own root is in. */
export type MenuProps = ArkRootProps;

/**
 * The menu's root — holds the open state and the highlighted item. No DOM node of its own.
 *
 * @example
 * ```tsx
 * <Menu>
 *   <MenuTrigger>Actions</MenuTrigger>
 *   <MenuPositioner>
 *     <MenuContent>
 *       <MenuItem value="rename">Rename</MenuItem>
 *       <MenuSeparator />
 *       <MenuItem value="delete">Delete</MenuItem>
 *     </MenuContent>
 *   </MenuPositioner>
 * </Menu>
 * ```
 */
export function Menu(props: MenuProps) {
  traceLife("ui.menu");

  return <ArkRoot {...dropAddress(props)} />;
}

/** Props of `MenuTrigger`. */
export type MenuTriggerProps = ArkTriggerProps;

/** Opens the menu — a real `<button>`; `value` names WHICH menu, in a multi-trigger composition. */
export function MenuTrigger(props: MenuTriggerProps) {
  traceLife("ui.menu-trigger");

  return <ArkTrigger {...dropAddress(props)} />;
}

/** Props of `MenuTriggerItem`. */
export type MenuTriggerItemProps = ArkTriggerItemProps;

/** A SUBMENU's own trigger, rendered as an item of its PARENT menu — carries both parents' addresses at once (`../entity/passport.ts`). */
export function MenuTriggerItem(props: MenuTriggerItemProps) {
  traceLife("ui.menu-trigger-item");

  return <ArkTriggerItem {...dropAddress(props)} />;
}

/** Props of `MenuContextTrigger`. */
export type MenuContextTriggerProps = ArkContextTriggerProps;

/** Wraps an existing element so right-click (or long-press, on touch) opens the menu at the pointer. */
export function MenuContextTrigger(props: MenuContextTriggerProps) {
  traceLife("ui.menu-context-trigger");

  return <ArkContextTrigger {...dropAddress(props)} />;
}

/** Props of `MenuPositioner`. */
export type MenuPositionerProps = ArkPositionerProps;

/** Positions `content` against whichever trigger opened it — the same `@zag-js/popper` mechanism as the popover's. */
export function MenuPositioner(props: MenuPositionerProps) {
  traceLife("ui.menu-positioner");

  return <ArkPositioner {...dropAddress(props)} />;
}

/** Props of `MenuArrow`. */
export type MenuArrowProps = ArkArrowProps;

/** Wraps `arrowTip` — ONE node, positioned by the kit; no graphic of its own. */
export function MenuArrow(props: MenuArrowProps) {
  traceLife("ui.menu-arrow");

  return <ArkArrow {...dropAddress(props)} />;
}

/** Props of `MenuArrowTip`. */
export type MenuArrowTipProps = ArkArrowTipProps;

/** The visible triangle INSIDE `arrow` — a skin draws its shape (typically a rotated square). */
export function MenuArrowTip(props: MenuArrowTipProps) {
  traceLife("ui.menu-arrow-tip");

  return <ArkArrowTip {...dropAddress(props)} />;
}

/** Props of `MenuContent`. */
export type MenuContentProps = ArkContentProps;

/** The floating panel — ONE node; holds real keyboard focus (items are "virtually" focused via `aria-activedescendant`, not individually). */
export function MenuContent(props: MenuContentProps) {
  traceLife("ui.menu-content");

  return <ArkContent {...dropAddress(props)} />;
}

/** Props of `MenuIndicator`. */
export type MenuIndicatorProps = ArkIndicatorProps;

/** A small marker on `trigger` for whether the menu is open — no graphic of its own. */
export function MenuIndicator(props: MenuIndicatorProps) {
  traceLife("ui.menu-indicator");

  return <ArkIndicator {...dropAddress(props)} />;
}

/** Props of `MenuSeparator`. */
export type MenuSeparatorProps = ArkSeparatorProps;

/** A visual/semantic divider between groups of items — ONE node, `role="separator"`. */
export function MenuSeparator(props: MenuSeparatorProps) {
  traceLife("ui.menu-separator");

  return <ArkSeparator {...dropAddress(props)} />;
}

/** Props of `MenuItemGroup`. */
export type MenuItemGroupProps = ArkItemGroupProps;

/** Wraps a labeled cluster of items — ONE node per group. */
export function MenuItemGroup(props: MenuItemGroupProps) {
  traceLife("ui.menu-item-group");

  return <ArkItemGroup {...dropAddress(props)} />;
}

/** Props of `MenuItemGroupLabel`. */
export type MenuItemGroupLabelProps = ArkItemGroupLabelProps;

/** The group's own heading — ONE node, wired to `itemGroup` via `aria-labelledby`. */
export function MenuItemGroupLabel(props: MenuItemGroupLabelProps) {
  traceLife("ui.menu-item-group-label");

  return <ArkItemGroupLabel {...dropAddress(props)} />;
}

/** Props of `MenuItem`. */
export type MenuItemProps = ArkItemProps;

/** One plain action — `value` is required; no checked state of its own (that's `MenuCheckboxItem`/`MenuRadioItem`). */
export function MenuItem(props: MenuItemProps) {
  traceLife("ui.menu-item");

  return <ArkItem {...dropAddress(props)} />;
}

/** Props of `MenuCheckboxItem`. */
export type MenuCheckboxItemProps = ArkCheckboxItemProps;

/** One independently-toggleable item — draws with `item`'s own address, `data-type="checkbox"` (`../entity/anatomy.ts`). */
export function MenuCheckboxItem(props: MenuCheckboxItemProps) {
  traceLife("ui.menu-checkbox-item");

  return <ArkCheckboxItem {...dropAddress(props)} />;
}

/** Props of `MenuRadioItemGroup`. */
export type MenuRadioItemGroupProps = ArkRadioItemGroupProps;

/** Wraps a set of `MenuRadioItem`s that share one chosen value — draws with `itemGroup`'s own address. */
export function MenuRadioItemGroup(props: MenuRadioItemGroupProps) {
  traceLife("ui.menu-radio-item-group");

  return <ArkRadioItemGroup {...dropAddress(props)} />;
}

/** Props of `MenuRadioItem`. */
export type MenuRadioItemProps = ArkRadioItemProps;

/** One choice within a `MenuRadioItemGroup` — draws with `item`'s own address, `data-type="radio"`. */
export function MenuRadioItem(props: MenuRadioItemProps) {
  traceLife("ui.menu-radio-item");

  return <ArkRadioItem {...dropAddress(props)} />;
}

/** Props of `MenuItemText`. */
export type MenuItemTextProps = ArkItemTextProps;

/** An item's own label text — ONE node; carries `checked`/`unchecked` only inside a checkbox/radio item. */
export function MenuItemText(props: MenuItemTextProps) {
  traceLife("ui.menu-item-text");

  return <ArkItemText {...dropAddress(props)} />;
}

/** Props of `MenuItemIndicator`. */
export type MenuItemIndicatorProps = ArkItemIndicatorProps;

/** A checkmark/dot slot INSIDE a checkbox/radio item — no graphic of its own; hidden by the kit while unchecked. */
export function MenuItemIndicator(props: MenuItemIndicatorProps) {
  traceLife("ui.menu-item-indicator");

  return <ArkItemIndicator {...dropAddress(props)} />;
}

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
  Menu,
);
