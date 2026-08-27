import {
  SelectRoot as ArkRoot,
  SelectLabel as ArkLabel,
  SelectControl as ArkControl,
  SelectTrigger as ArkTrigger,
  SelectValueText as ArkValueText,
  SelectClearTrigger as ArkClearTrigger,
  SelectIndicator as ArkIndicator,
  SelectPositioner as ArkPositioner,
  SelectContent as ArkContent,
  SelectList as ArkList,
  SelectItemGroup as ArkItemGroup,
  SelectItemGroupLabel as ArkItemGroupLabel,
  SelectItem as ArkItem,
  SelectItemText as ArkItemText,
  SelectItemIndicator as ArkItemIndicator,
  SelectHiddenSelect as ArkHiddenSelect,
  createListCollection,
  type CollectionItem,
  type ListCollection,
  type SelectRootProps as ArkRootProps,
  type SelectLabelProps as ArkLabelProps,
  type SelectControlProps as ArkControlProps,
  type SelectTriggerProps as ArkTriggerProps,
  type SelectValueTextProps as ArkValueTextProps,
  type SelectClearTriggerProps as ArkClearTriggerProps,
  type SelectIndicatorProps as ArkIndicatorProps,
  type SelectPositionerProps as ArkPositionerProps,
  type SelectContentProps as ArkContentProps,
  type SelectListProps as ArkListProps,
  type SelectItemGroupProps as ArkItemGroupProps,
  type SelectItemGroupLabelProps as ArkItemGroupLabelProps,
  type SelectItemProps as ArkItemProps,
  type SelectItemTextProps as ArkItemTextProps,
  type SelectItemIndicatorProps as ArkItemIndicatorProps,
  type SelectHiddenSelectProps as ArkHiddenSelectProps,
} from "@ark-ui/solid/select";

import { dropAddress, slotAware } from "../../slot-chain.js";
import { traceLife } from "../../trace.js";

// Select — a floating dropdown over a data-driven item collection, the kit's first component
// with both (`ark-ui.com/docs/components/select`).
//
// Same device as the accordion and the checkbox: anatomy is Ark's, the address is set by Ark
// itself (spreads `parts.*.attrs` inside every `getXxxProps()`, `select.connect.mjs`), wrappers
// are thin, `dropAddress` strips any address arriving from OUTSIDE (by hand, or from an outer
// link in a composition) so a node never lies about what it is (`PWEB-46`).
//
// `createListCollection`/`CollectionItem`/`ListCollection` are re-exported here, not left for the
// consumer to reach into `@ark-ui/solid` directly for: `Select` cannot function AT ALL without a
// collection (`collection` is a required prop, not sugar), and the kit's whole point is that a
// consumer never needs a second import for the same component's own mechanism.
//
// `HiddenSelect` carries no address (`../entity/anatomy.ts`, `../entity/passport.ts`) — the real
// `<select>` it renders stays in the document for form submission, autofill, and native `change`,
// but Ark never spreads an address onto it, the same as the checkbox's hidden input.

export { createListCollection, type CollectionItem, type ListCollection };

/** Props of `Select` — the root, generic over the collection's item type. */
export type SelectProps<T extends CollectionItem = CollectionItem> = ArkRootProps<T>;

/**
 * The set's root — holds the collection, the selected value(s), and whether several can be
 * selected at once (`multiple`).
 *
 * @example
 * ```tsx
 * const collection = createListCollection({
 *   items: [{ value: "apple", label: "Apple" }, { value: "banana", label: "Banana" }],
 * });
 *
 * <Select collection={collection}>
 *   <SelectLabel>Fruit</SelectLabel>
 *   <SelectControl>
 *     <SelectTrigger>
 *       <SelectValueText placeholder="Pick a fruit" />
 *     </SelectTrigger>
 *     <SelectIndicator>▾</SelectIndicator>
 *   </SelectControl>
 *   <SelectPositioner>
 *     <SelectContent>
 *       <For each={collection.items}>
 *         {(item) => (
 *           <SelectItem item={item}>
 *             <SelectItemText>{item.label}</SelectItemText>
 *             <SelectItemIndicator>✓</SelectItemIndicator>
 *           </SelectItem>
 *         )}
 *       </For>
 *     </SelectContent>
 *   </SelectPositioner>
 *   <SelectHiddenSelect />
 * </Select>
 * ```
 */
export const Select = slotAware(function Select<T extends CollectionItem = CollectionItem>(
  props: SelectProps<T>,
) {
  traceLife("ui.select");

  return <ArkRoot {...dropAddress(props)} />;
});

/** Props of `SelectLabel`. */
export type SelectLabelProps = ArkLabelProps;

/** The set's label — ONE `<label>` node, wired to the hidden native `<select>`. */
export function SelectLabel(props: SelectLabelProps) {
  traceLife("ui.select-label");

  return <ArkLabel {...dropAddress(props)} />;
}

/** Props of `SelectControl`. */
export type SelectControlProps = ArkControlProps;

/** Wrapper for the trigger and its indicators — ONE node, no behavior of its own. */
export function SelectControl(props: SelectControlProps) {
  traceLife("ui.select-control");

  return <ArkControl {...dropAddress(props)} />;
}

/** Props of `SelectTrigger`. */
export type SelectTriggerProps = ArkTriggerProps;

/** The button that opens and closes the dropdown — ONE real `<button>` node. */
export function SelectTrigger(props: SelectTriggerProps) {
  traceLife("ui.select-trigger");

  return <ArkTrigger {...dropAddress(props)} />;
}

/** Props of `SelectValueText`. */
export type SelectValueTextProps = ArkValueTextProps;

/**
 * Displays the selected value(s), or the `placeholder` when none is chosen — ONE node.
 *
 * Occupied by the kit's own computed text: the consumer names a placeholder, not children.
 */
export function SelectValueText(props: SelectValueTextProps) {
  traceLife("ui.select-value-text");

  return <ArkValueText {...dropAddress(props)} />;
}

/** Props of `SelectClearTrigger`. */
export type SelectClearTriggerProps = ArkClearTriggerProps;

/** Button that clears the current selection — ONE node, hidden by the kit while nothing is selected. */
export function SelectClearTrigger(props: SelectClearTriggerProps) {
  traceLife("ui.select-clear-trigger");

  return <ArkClearTrigger {...dropAddress(props)} />;
}

/** Props of `SelectIndicator`. */
export type SelectIndicatorProps = ArkIndicatorProps;

/** Open/closed indicator — ONE node, hidden from screen readers; the consumer places the glyph. */
export function SelectIndicator(props: SelectIndicatorProps) {
  traceLife("ui.select-indicator");

  return <ArkIndicator {...dropAddress(props)} />;
}

/** Props of `SelectPositioner`. */
export type SelectPositionerProps = ArkPositionerProps;

/** Positions the floating content relative to the trigger — ONE node, no look of its own. */
export function SelectPositioner(props: SelectPositionerProps) {
  traceLife("ui.select-positioner");

  return <ArkPositioner {...dropAddress(props)} />;
}

/** Props of `SelectContent`. */
export type SelectContentProps = ArkContentProps;

/** The floating dropdown itself — ONE node; hidden, not removed, while closed. */
export function SelectContent(props: SelectContentProps) {
  traceLife("ui.select-content");

  return <ArkContent {...dropAddress(props)} />;
}

/** Props of `SelectList`. */
export type SelectListProps = ArkListProps;

/**
 * An inner listbox region inside the content — ONE node.
 *
 * Not in Ark's own documented example (items nest straight in `SelectContent` there); real, part
 * of the anatomy the kit takes whole, and left available for the composition that needs an inner
 * scroll region separate from the content's own chrome.
 */
export function SelectList(props: SelectListProps) {
  traceLife("ui.select-list");

  return <ArkList {...dropAddress(props)} />;
}

/** Props of `SelectItemGroup`. */
export type SelectItemGroupProps = ArkItemGroupProps;

/** Groups related items under one label — ONE node. */
export function SelectItemGroup(props: SelectItemGroupProps) {
  traceLife("ui.select-item-group");

  return <ArkItemGroup {...dropAddress(props)} />;
}

/** Props of `SelectItemGroupLabel`. */
export type SelectItemGroupLabelProps = ArkItemGroupLabelProps;

/** Label of an item group — ONE node. */
export function SelectItemGroupLabel(props: SelectItemGroupLabelProps) {
  traceLife("ui.select-item-group-label");

  return <ArkItemGroupLabel {...dropAddress(props)} />;
}

/** Props of `SelectItem`. */
export type SelectItemProps = ArkItemProps;

/** One selectable option — ONE node; `item` (the collection entry it renders) is required. */
export function SelectItem(props: SelectItemProps) {
  traceLife("ui.select-item");

  return <ArkItem {...dropAddress(props)} />;
}

/** Props of `SelectItemText`. */
export type SelectItemTextProps = ArkItemTextProps;

/** An item's visible label — ONE node. */
export function SelectItemText(props: SelectItemTextProps) {
  traceLife("ui.select-item-text");

  return <ArkItemText {...dropAddress(props)} />;
}

/** Props of `SelectItemIndicator`. */
export type SelectItemIndicatorProps = ArkItemIndicatorProps;

/**
 * Selected-item indicator — ONE node, hidden from screen readers; hidden from view (`hidden`)
 * while its item is not selected. The consumer places the checkmark: the kit brings no graphic
 * of its own, the same as the accordion's expansion indicator.
 */
export function SelectItemIndicator(props: SelectItemIndicatorProps) {
  traceLife("ui.select-item-indicator");

  return <ArkItemIndicator {...dropAddress(props)} />;
}

/** Props of `SelectHiddenSelect`. */
export type SelectHiddenSelectProps = ArkHiddenSelectProps;

/**
 * The real, visually hidden `<select>` — form submission, browser autofill, and native `change`.
 *
 * Carries no address (`../entity/anatomy.ts`, "hiddenSelect carries NO part"): a node the
 * provider does not address is not addressable by us either.
 */
export function SelectHiddenSelect(props: SelectHiddenSelectProps) {
  traceLife("ui.select-hidden-select");

  return <ArkHiddenSelect {...dropAddress(props)} />;
}
