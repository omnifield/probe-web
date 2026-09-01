import {
  SegmentGroupIndicator as ArkIndicator,
  SegmentGroupItem as ArkItem,
  SegmentGroupItemControl as ArkItemControl,
  SegmentGroupItemHiddenInput as ArkItemHiddenInput,
  SegmentGroupItemText as ArkItemText,
  SegmentGroupLabel as ArkLabel,
  SegmentGroupRoot as ArkRoot,
  type SegmentGroupIndicatorProps as ArkIndicatorProps,
  type SegmentGroupItemControlProps as ArkItemControlProps,
  type SegmentGroupItemHiddenInputProps as ArkItemHiddenInputProps,
  type SegmentGroupItemProps as ArkItemProps,
  type SegmentGroupItemTextProps as ArkItemTextProps,
  type SegmentGroupLabelProps as ArkLabelProps,
  type SegmentGroupRootProps as ArkRootProps,
} from "@ark-ui/solid/segment-group";

import { splitProps } from "solid-js";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

// Segment group — one value chosen out of several, shown as a segmented control, from Ark
// (`ark-ui.com/docs/components/segment-group`).
//
// NOT A SEPARATE MACHINE — this wraps `@ark-ui/solid/segment-group`, which is itself
// `@zag-js/radio-group`'s own machine renamed (`../entity/anatomy.ts` explains the chain in
// full). Same device as the rest of the Ark-provided kit regardless: anatomy sets the address
// (spreads `parts.*.attrs` inside every `getXxxProps()`), wrappers are thin, `dropAddress` strips
// any address arriving from OUTSIDE so a node never lies about what it is (`PWEB-46`).
//
// Each item's real `<input type="radio">` stays in the document for focus, form participation,
// and the screen reader, but carries no anatomy address of its own — same finding as the radio
// group's own hidden input (`../entity/passport.ts`).

/** Props of `SegmentGroup` — the root. */
export type SegmentGroupProps = ArkRootProps;

/**
 * The set's root — holds the chosen value (`value` / `defaultValue` / `onValueChange`) and the
 * orientation.
 *
 * @example
 * ```tsx
 * <SegmentGroup defaultValue="react">
 *   <SegmentGroupIndicator />
 *   <SegmentGroupItem value="react">
 *     <SegmentGroupItemText>React</SegmentGroupItemText>
 *     <SegmentGroupItemControl />
 *   </SegmentGroupItem>
 *   <SegmentGroupItem value="solid">
 *     <SegmentGroupItemText>Solid</SegmentGroupItemText>
 *     <SegmentGroupItemControl />
 *   </SegmentGroupItem>
 * </SegmentGroup>
 * ```
 */
export function SegmentGroup(props: SegmentGroupProps) {
  traceLife("ui.segment-group");

  return <ArkRoot {...dropAddress(props)} />;
}

/** Props of `SegmentGroupLabel`. */
export type SegmentGroupLabelProps = ArkLabelProps;

/** The set's own label — ONE node, distinct from each item's own `SegmentGroupItemText`. */
export function SegmentGroupLabel(props: SegmentGroupLabelProps) {
  traceLife("ui.segment-group-label");

  return <ArkLabel {...dropAddress(props)} />;
}

/** Props of `SegmentGroupItem`. */
export type SegmentGroupItemProps = ArkItemProps;

/**
 * One choice — a `<label>` node; `value` is required.
 *
 * Несёт своё скрытое `<input type="radio">` сам (постановка user, 2026-09-01, README «`extras` —
 * проверка по всему киту: кейса не нашлось ни одного») — оно не берёт от сборки данных, только
 * контекст, который уже поднял этот же `item`.
 */
export function SegmentGroupItem(props: SegmentGroupItemProps) {
  traceLife("ui.segment-group-item");

  const [local, rest] = splitProps(props, ["children"]);

  return (
    <ArkItem {...dropAddress(rest)}>
      {local.children}
      <ArkItemHiddenInput />
    </ArkItem>
  );
}

/** Props of `SegmentGroupItemText`. */
export type SegmentGroupItemTextProps = ArkItemTextProps;

/** One item's own label text — ONE `<span>` node. */
export function SegmentGroupItemText(props: SegmentGroupItemTextProps) {
  traceLife("ui.segment-group-item-text");

  return <ArkItemText {...dropAddress(props)} />;
}

/** Props of `SegmentGroupItemControl`. */
export type SegmentGroupItemControlProps = ArkItemControlProps;

/** One item's own visible surface — the node the sliding indicator sizes itself against. */
export function SegmentGroupItemControl(props: SegmentGroupItemControlProps) {
  traceLife("ui.segment-group-item-control");

  return <ArkItemControl {...dropAddress(props)} />;
}

/** Props of `SegmentGroupItemHiddenInput`. */
export type SegmentGroupItemHiddenInputProps = ArkItemHiddenInputProps;

/**
 * Each item's real, hidden `<input type="radio">` — for focus, form participation, and the
 * screen reader.
 *
 * Carries no address (`../entity/passport.ts`, "the hidden input, again"): a part the provider
 * never addressed is not addressable by us either. `SegmentGroupItem` (above) already renders one
 * of these itself, per item — this export stays for manual composition outside a schema.
 */
export function SegmentGroupItemHiddenInput(
  props: SegmentGroupItemHiddenInputProps,
) {
  traceLife("ui.segment-group-item-hidden-input");

  return <ArkItemHiddenInput {...dropAddress(props)} />;
}

/** Props of `SegmentGroupIndicator`. */
export type SegmentGroupIndicatorProps = ArkIndicatorProps;

/**
 * The single sliding indicator — ONE node, measured and positioned by the kit under whichever
 * item is chosen. No graphic of its own, the same device as the radio group's own indicator.
 */
export function SegmentGroupIndicator(props: SegmentGroupIndicatorProps) {
  traceLife("ui.segment-group-indicator");

  return <ArkIndicator {...dropAddress(props)} />;
}

// MAP of the segment group: passport part → the component that draws it (`PWEB-84`).

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";

/**
 * The segment group's passport together with whatever draws each of its six parts.
 *
 * НЕТ `hiddenInput` в карте (постановка user, 2026-09-01, README «`extras` — проверка по всему
 * киту: кейса не нашлось ни одного») — он не берёт от сборки данных, `SegmentGroupItem` кладёт
 * его сам, по одному на каждый пункт.
 */
export const kit = defineKitComponent(passport, {
  root: SegmentGroup,
  label: SegmentGroupLabel,
  item: SegmentGroupItem,
  itemText: SegmentGroupItemText,
  itemControl: SegmentGroupItemControl,
  indicator: SegmentGroupIndicator,
});
