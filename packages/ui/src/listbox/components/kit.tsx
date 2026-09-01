import {
  ListboxContent as ArkContent,
  ListboxEmpty as ArkEmpty,
  ListboxInput as ArkInput,
  ListboxItem as ArkItem,
  ListboxItemGroup as ArkItemGroup,
  ListboxItemGroupLabel as ArkItemGroupLabel,
  ListboxItemIndicator as ArkItemIndicator,
  ListboxItemText as ArkItemText,
  ListboxLabel as ArkLabel,
  ListboxRoot as ArkRoot,
  ListboxValueText as ArkValueText,
  type ListboxContentProps as ArkContentProps,
  type ListboxEmptyProps as ArkEmptyProps,
  type ListboxInputProps as ArkInputProps,
  type ListboxItemGroupLabelProps as ArkItemGroupLabelProps,
  type ListboxItemGroupProps as ArkItemGroupProps,
  type ListboxItemIndicatorProps as ArkItemIndicatorProps,
  type ListboxItemProps as ArkItemProps,
  type ListboxItemTextProps as ArkItemTextProps,
  type ListboxLabelProps as ArkLabelProps,
  type ListboxRootProps as ArkRootProps,
  type ListboxValueTextProps as ArkValueTextProps,
} from "@ark-ui/solid/listbox";
import { createMemo, splitProps } from "solid-js";

import { defineKitComponent } from "../../kit-form.js";
import {
  createListCollection,
  type CollectionItem,
} from "../../shared/utils/collection.js";
import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";
import { passport } from "../entity/passport.js";

// Listbox — a selectable list of options, single or multiple, over a data-driven item collection
// (`ark-ui.com/docs/components/listbox`). The select's nearest sibling in the kit — same
// `collection`/`CollectionItem`/`createListCollection` mechanism, same item/itemText/
// itemIndicator/itemGroup/itemGroupLabel shape — but with NO floating layer of its own: every
// part is always in the document, there is no trigger to open or close, no positioner, no
// `data-state="open" | "closed"` anywhere in the anatomy at all.
//
// Same device as the accordion and the select: anatomy is Ark's (`../entity/anatomy.ts`), the
// address is set by Ark itself (spreads `parts.*.attrs` inside every `getXxxProps()`,
// `listbox.connect.mjs`), wrappers are thin, `dropAddress` strips any address arriving from
// OUTSIDE so a node never lies about what it is (`PWEB-46`).
//
// THIS FILE IS THE REAL THING (`PWEB-195` continuation, 2026-08-30 — found on listbox itself,
// then corrected here): the actual component implementations AND the passport-part map that
// draws them together, in one place, because the map is a trivial, local fact about components
// defined two lines above it — it does not deserve a second file reaching back in to fetch them.
// `./index.ts` is the OUTWARD face — a plain re-export list, nothing defined there. Before this,
// the names were swapped: `index.tsx` held the real implementations (wrong — an "index" is a
// facade by every other convention in this codebase, `PROBEWEB-4`'s "what leaves this folder
// outward"), and `kit.ts` had to import the very components it was named to just describe,
// making it a SECOND, accidental export surface for the same components under a different name.
//
// `createListCollection`/`CollectionItem`/`ListCollection` come from `../../shared/utils/collection.js`
// now, not from this Ark subpath directly (`PWEB-195` continuation, 2026-08-30) — the same three
// names the select's own `Select` reaches for, ONE place instead of two copies that would collide
// once the package's root `index.ts` starts re-exporting every folder with `export *`. Not
// re-exported from HERE any more either: a consumer building an item array by hand reaches for
// `shared/utils/collection.js` directly, the same as this file does.
//
// ## `items`, not `collection` — the live object is built ONE layer in, not carried by the caller
//
// Ark's own `ListboxRoot` requires a real `ListCollection` instance — not JSON, not `bind`-able
// by the assembly mechanism, which only ever resolves plain data (`packages/skin`'s
// `resolveDataBinding`). Asking every CALLER to build that instance itself (the select's own
// `Listbox`-sibling still does, and its `playground/assemblies.ts` pays for it: a hand-built
// collection baked into the file, real content hardcoded next to it) pushes a live-object
// requirement outward onto exactly the place — a data-bound assembly skeleton — that is supposed
// to carry no data and no logic at all (`PWEB-187` continuation, 2026-08-30, decided with user:
// "если нужен живой объект, на входе всё равно принимаются данные, а внутри — если нужно — они
// превращаются в живой объект").
//
// So the boundary moves ONE layer in, not away: `Listbox` takes `items` — plain data, the exact
// shape `entity/io.ts` declares and an assembly can `bind` to a JSON path — and builds the real
// `ListCollection` itself, memoized so identity is stable across re-renders that do not change the
// items. Everything downstream (`ListboxItem`'s `item` prop, `collection.size`, keyboard nav) sees
// the same live object Ark always expected; only WHERE it gets built moved.
//
// `Empty` mounts ONLY while the collection is empty (Ark wraps it in `<Show when={size() === 0}>`
// itself, `listbox-empty.tsx`) — the kit passes it through unchanged; there is nothing to gate a
// second time.

/** Props of `Listbox` — the root, generic over the item type. `collection` is not among them. */
export interface ListboxProps<
  T extends CollectionItem = CollectionItem,
> extends Omit<ArkRootProps<T>, "collection"> {
  /** Plain items — the kit builds the real `ListCollection` from these, once, memoized. */
  readonly items: readonly T[];
}

/**
 * The list's root — ONE node plus context.
 *
 * Takes plain `items`; builds the `ListCollection` Ark needs internally. Also holds the selected
 * value(s) (`value` / `defaultValue` / `onValueChange`), `selectionMode`
 * (`"single" | "multiple" | "extended"`), and `orientation`.
 *
 * @example
 * ```tsx
 * <Listbox items={[{ value: "us", label: "United States" }, { value: "uk", label: "United Kingdom" }]}>
 *   <ListboxLabel>Select Country</ListboxLabel>
 *   <ListboxContent>
 *     <ListboxItem item={{ value: "us", label: "United States" }}>
 *       <ListboxItemText>United States</ListboxItemText>
 *       <ListboxItemIndicator>✓</ListboxItemIndicator>
 *     </ListboxItem>
 *   </ListboxContent>
 * </Listbox>
 * ```
 */
export function Listbox<T extends CollectionItem = CollectionItem>(
  props: ListboxProps<T>,
) {
  traceLife("ui.listbox");

  const [local, rest] = splitProps(props, ["items"]);
  // Memoized, not rebuilt on every render unrelated to `items`: identity matters to Ark's own
  // internals (`computed("selection")` re-derives from `context.get("value")`, not from
  // `collection` changing shape) — a fresh instance every render would be correct but wasteful.
  //
  // `?? []`, not trusting the type: `items` genuinely arrives `undefined` at a system boundary
  // `tsc` cannot see through — a `bind: { items: "/items" }` whose path is not there YET (data
  // still loading) or not there AT ALL resolves to `undefined`, same as any JSON Pointer miss
  // (`resolveDataBinding`), not a shape the assembly author wrote or the type checker can catch.
  // `createListCollection` itself throws `TypeError: options.items is not iterable` on that,
  // measured live, not guessed — an empty list is the honest look for "no items yet", not a crash.
  const collection = createMemo(() =>
    createListCollection<T>({ items: local.items ?? [] }),
  );

  return <ArkRoot {...dropAddress(rest)} collection={collection()} />;
}

/** Props of `ListboxLabel`. */
export type ListboxLabelProps = ArkLabelProps;

/** The list's label — ONE `<span>` node. */
export function ListboxLabel(props: ListboxLabelProps) {
  traceLife("ui.listbox-label");

  return <ArkLabel {...dropAddress(props)} />;
}

/** Props of `ListboxInput`. */
export type ListboxInputProps = ArkInputProps;

/**
 * Optional filter/search text field — ONE `<input>` node.
 *
 * Not part of Ark's own basic example; real, addressed, and meant for the `filter` scenario
 * (`useListCollection`'s `filter` function narrows `collection.items`, this input drives it).
 */
export function ListboxInput(props: ListboxInputProps) {
  traceLife("ui.listbox-input");

  return <ArkInput {...dropAddress(props)} />;
}

/** Props of `ListboxContent`. */
export type ListboxContentProps = ArkContentProps;

/** Wraps the items — ONE node; the scrollable/navigable region, always in the document. */
export function ListboxContent(props: ListboxContentProps) {
  traceLife("ui.listbox-content");

  return <ArkContent {...dropAddress(props)} />;
}

/** Props of `ListboxItemGroup`. */
export type ListboxItemGroupProps = ArkItemGroupProps;

/** Groups related items under one label — ONE node. */
export function ListboxItemGroup(props: ListboxItemGroupProps) {
  traceLife("ui.listbox-item-group");

  return <ArkItemGroup {...dropAddress(props)} />;
}

/** Props of `ListboxItemGroupLabel`. */
export type ListboxItemGroupLabelProps = ArkItemGroupLabelProps;

/** Label of an item group — ONE node. */
export function ListboxItemGroupLabel(props: ListboxItemGroupLabelProps) {
  traceLife("ui.listbox-item-group-label");

  return <ArkItemGroupLabel {...dropAddress(props)} />;
}

/** Props of `ListboxItem`. */
export type ListboxItemProps = ArkItemProps;

/** One selectable option — ONE node; `item` (the collection entry it renders) is required. */
export function ListboxItem(props: ListboxItemProps) {
  traceLife("ui.listbox-item");

  return <ArkItem {...dropAddress(props)} />;
}

/** Props of `ListboxItemText`. */
export type ListboxItemTextProps = ArkItemTextProps;

/** An item's visible label — ONE node. */
export function ListboxItemText(props: ListboxItemTextProps) {
  traceLife("ui.listbox-item-text");

  return <ArkItemText {...dropAddress(props)} />;
}

/** Props of `ListboxItemIndicator`. */
export type ListboxItemIndicatorProps = ArkItemIndicatorProps;

/**
 * Selected-item indicator — ONE node, hidden from screen readers; hidden from view (`hidden`)
 * while its item is not selected. The consumer places the checkmark: the kit brings no graphic of
 * its own, the same as the select's own item indicator.
 */
export function ListboxItemIndicator(props: ListboxItemIndicatorProps) {
  traceLife("ui.listbox-item-indicator");

  return <ArkItemIndicator {...dropAddress(props)} />;
}

/** Props of `ListboxValueText`. */
export type ListboxValueTextProps = ArkValueTextProps;

/** Displays the selected value(s) as a comma-separated string, or the `placeholder` — ONE node. */
export function ListboxValueText(props: ListboxValueTextProps) {
  traceLife("ui.listbox-value-text");

  return <ArkValueText {...dropAddress(props)} />;
}

/** Props of `ListboxEmpty`. */
export type ListboxEmptyProps = ArkEmptyProps;

/**
 * Shown ONLY while the collection is empty — ONE node; Ark itself gates its mounting
 * (`<Show when={collection.size === 0}>`, `listbox-empty.tsx`), the kit adds no gate of its own.
 */
export function ListboxEmpty(props: ListboxEmptyProps) {
  traceLife("ui.listbox-empty");

  return <ArkEmpty {...dropAddress(props)} />;
}

// MAP of the listbox: passport part → the component that draws it (`PWEB-84`) — local references,
// no import needed, the components are defined two screens up in this same file.
//
// `empty` IS here, unlike `hiddenSelect` on the select's own map: `empty` carries a real anatomy
// part (`../entity/anatomy.ts` — the `.extendWith("empty")` part) and Ark spreads its address the
// same way as any other part; it only differs in WHEN it mounts, not in whether it is addressed.

/** The listbox's passport together with whatever draws each of its eleven parts. */
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
