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
import { createMemo, splitProps } from "solid-js";
import { Portal } from "solid-js/web";

import { defineKitComponent } from "../../kit-form.js";
import {
  createListCollection,
  type CollectionItem,
} from "../../shared/utils/collection.js";
import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";
import { passport } from "../entity/passport.js";

// Select — a floating dropdown over a data-driven item collection, the kit's first component
// with both (`ark-ui.com/docs/components/select`).
//
// Same device as the accordion and the checkbox: anatomy is Ark's, the address is set by Ark
// itself (spreads `parts.*.attrs` inside every `getXxxProps()`, `select.connect.mjs`), wrappers
// are thin, `dropAddress` strips any address arriving from OUTSIDE (by hand, or from an outer
// link in a composition) so a node never lies about what it is (`PWEB-46`).
//
// THIS FILE IS THE REAL THING (`PWEB-195` continuation, 2026-08-30 — same restructuring already
// applied to the listbox, see its own `kit.tsx` header): the actual component implementations
// AND the passport-part map that draws them together, in one place. `./index.ts` is the OUTWARD
// face — a plain re-export list, nothing defined there.
//
// `createListCollection`/`CollectionItem`/`ListCollection` come from `../../shared/utils/collection.js`
// now, not from `@ark-ui/solid/select` directly — the same three names the listbox's own
// `Listbox` reaches for, ONE place instead of two copies that would collide once the package's
// root `index.ts` starts re-exporting every folder with `export *`. Same fix as the listbox's own
// (`PWEB-195`/`PWEB-201`, 2026-08-30): Ark's `SelectRoot` requires a real `ListCollection`
// instance, not JSON, not `bind`-able by the assembly mechanism (`packages/skin`'s
// `resolveDataBinding` only ever resolves plain data). The select used to ask every caller to
// build that instance itself — its own `playground/assemblies.ts` paid for it: a hand-built
// collection baked into the file, real content (`fruits`) hardcoded next to it, found wrong the
// same day the listbox's identical shape was. The live object is built ONE layer in instead:
// `Select` takes `items` — plain data, the shape `entity/io.ts` declares and an assembly can
// `bind` to a JSON path — and builds the real `ListCollection` itself, memoized.
//
// `HiddenSelect` carries no address (`../entity/anatomy.ts`, `../entity/passport.ts`) — the real
// `<select>` it renders stays in the document for form submission, autofill, and native `change`,
// but Ark never spreads an address onto it, the same as the checkbox's hidden input.
//
// `Select` is a plain function, not `slotAware`-wrapped (removed 2026-08-30) — `slotAware` marks
// a component as a legal `as` target for the kobalte-era composition chain (`utils/slot-chain.ts`),
// and nothing composes a select that way: the listbox, its nearest sibling, was never wrapped
// either. Leftover from before this file moved off kobalte, not a real requirement.

/** Props of `Select` — the root, generic over the item type. `collection` is not among them. */
export interface SelectProps<
  T extends CollectionItem = CollectionItem,
> extends Omit<ArkRootProps<T>, "collection"> {
  /** Plain items — the kit builds the real `ListCollection` from these, once, memoized. */
  readonly items: readonly T[];
}

/**
 * The set's root — takes plain `items`, builds the `ListCollection` Ark needs internally. Also
 * holds the selected value(s) and whether several can be selected at once (`multiple`).
 *
 * @example
 * ```tsx
 * <Select items={[{ value: "apple", label: "Apple" }, { value: "banana", label: "Banana" }]}>
 *   <SelectLabel>Fruit</SelectLabel>
 *   <SelectControl>
 *     <SelectTrigger>
 *       <SelectValueText placeholder="Pick a fruit" />
 *     </SelectTrigger>
 *     <SelectIndicator>▾</SelectIndicator>
 *   </SelectControl>
 *   <SelectPositioner>
 *     <SelectContent>
 *       <SelectItem item={{ value: "apple", label: "Apple" }}>
 *         <SelectItemText>Apple</SelectItemText>
 *         <SelectItemIndicator>✓</SelectItemIndicator>
 *       </SelectItem>
 *     </SelectContent>
 *   </SelectPositioner>
 *   <SelectHiddenSelect />
 * </Select>
 * ```
 */
export function Select<T extends CollectionItem = CollectionItem>(
  props: SelectProps<T>,
) {
  traceLife("ui.select");

  const [local, rest] = splitProps(props, ["items"]);
  // Memoized, and `?? []` at the boundary — same reasoning as the listbox's own `Listbox`
  // (`PWEB-195`): a `bind: { items: "/items" }` whose path has not arrived yet resolves to
  // `undefined`, and `createListCollection` throws on that, measured live, not guessed.
  const collection = createMemo(() =>
    createListCollection<T>({ items: local.items ?? [] }),
  );

  return <ArkRoot {...dropAddress(rest)} collection={collection()} />;
}

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

/**
 * Positions the floating content relative to the trigger — ONE node, no look of its own.
 *
 * Wrapped in a `Portal` (`solid-js/web`) — Ark's own real usage example does the same
 * (`ark-ui.com`'s "basic" example, checked directly, not assumed): without it, the positioner
 * stays a DOM descendant of wherever `Select` was composed, and while floating-ui still computes
 * the right on-screen coordinates for it, its PAINT/CLICK order stays tied to that ancestor —
 * found live, 2026-08-30, composed inside a sidebar panel: the dropdown was visible and correctly
 * positioned, but a later, unrelated DOM sibling elsewhere on the page sat on top of it and
 * silently absorbed every click. A portal moves the node to the end of `document.body`, the same
 * place Ark's own popper math assumes it lives.
 */
export function SelectPositioner(props: SelectPositionerProps) {
  traceLife("ui.select-positioner");

  return (
    <Portal>
      <ArkPositioner {...dropAddress(props)} />
    </Portal>
  );
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

// MAP of the select: passport part → the component that draws it (`PWEB-84`) — local references,
// no import needed, the components are defined above in this same file.
//
// Fifteen parts, the largest map in the kit — and it is exactly where the map earns its keep the
// most: a consumer guessing how `itemGroupLabel` turns into `SelectItemGroupLabel` would be
// right up until the first part that breaks the pattern (`valueText` → `SelectValueText`, not
// `SelectValue`).
//
// `hiddenSelect` is not here: it carries no part in the anatomy (`../entity/anatomy.ts`), and the
// map's keys are checked against anatomy parts, not against the full set of rendered nodes.

/** The select's passport together with whatever draws each of its fifteen parts. */
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
