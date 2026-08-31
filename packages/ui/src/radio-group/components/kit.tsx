import {
  RadioGroupIndicator as ArkIndicator,
  RadioGroupItem as ArkItem,
  RadioGroupItemControl as ArkItemControl,
  RadioGroupItemHiddenInput as ArkItemHiddenInput,
  RadioGroupItemText as ArkItemText,
  RadioGroupLabel as ArkLabel,
  RadioGroupRoot as ArkRoot,
  type RadioGroupIndicatorProps as ArkIndicatorProps,
  type RadioGroupItemControlProps as ArkItemControlProps,
  type RadioGroupItemHiddenInputProps as ArkItemHiddenInputProps,
  type RadioGroupItemProps as ArkItemProps,
  type RadioGroupItemTextProps as ArkItemTextProps,
  type RadioGroupLabelProps as ArkLabelProps,
  type RadioGroupRootProps as ArkRootProps,
} from "@ark-ui/solid/radio-group";

import { dropAddress } from "../../utils/slot-chain.js";
import { traceLife } from "../../utils/trace.js";

// Radio group — one value chosen out of several, from Ark
// (`ark-ui.com/docs/components/radio-group`).
//
// Same device as the rest of the Ark-provided kit: anatomy is Ark's (re-exported straight from
// `@zag-js/radio-group`, `../entity/anatomy.ts`), the address is set by Ark itself (spreads
// `parts.*.attrs` inside every `getXxxProps()`, `radio-group.connect.mjs`), wrappers are thin,
// `dropAddress` strips any address arriving from OUTSIDE so a node never lies about what it is
// (`PWEB-46`).
//
// Each item's real `<input type="radio">` stays in the document for focus, form participation,
// and the screen reader, but carries no anatomy address of its own — same finding as the
// checkbox's hidden input (`../entity/passport.ts`).

/** Props of `RadioGroup` — the root. */
export type RadioGroupProps = ArkRootProps;

/**
 * The set's root — holds the chosen value (`value` / `defaultValue` / `onValueChange`) and the
 * orientation.
 *
 * @example
 * ```tsx
 * <RadioGroup>
 *   <RadioGroupLabel>Delivery</RadioGroupLabel>
 *   <RadioGroupItem value="standard">
 *     <RadioGroupItemControl>
 *       <RadioGroupIndicator />
 *     </RadioGroupItemControl>
 *     <RadioGroupItemText>Standard</RadioGroupItemText>
 *   </RadioGroupItem>
 *   <RadioGroupItem value="express">
 *     <RadioGroupItemControl>
 *       <RadioGroupIndicator />
 *     </RadioGroupItemControl>
 *     <RadioGroupItemText>Express</RadioGroupItemText>
 *   </RadioGroupItem>
 * </RadioGroup>
 * ```
 */
export function RadioGroup(props: RadioGroupProps) {
  traceLife("ui.radio-group");

  return <ArkRoot {...dropAddress(props)} />;
}

/** Props of `RadioGroupLabel`. */
export type RadioGroupLabelProps = ArkLabelProps;

/** The set's own label — ONE node, distinct from each item's own `RadioGroupItemText`. */
export function RadioGroupLabel(props: RadioGroupLabelProps) {
  traceLife("ui.radio-group-label");

  return <ArkLabel {...dropAddress(props)} />;
}

/** Props of `RadioGroupItem`. */
export type RadioGroupItemProps = ArkItemProps;

/** One choice — a `<label>` node; `value` is required. */
export function RadioGroupItem(props: RadioGroupItemProps) {
  traceLife("ui.radio-group-item");

  return <ArkItem {...dropAddress(props)} />;
}

/** Props of `RadioGroupItemText`. */
export type RadioGroupItemTextProps = ArkItemTextProps;

/** One item's own label text — ONE `<span>` node. */
export function RadioGroupItemText(props: RadioGroupItemTextProps) {
  traceLife("ui.radio-group-item-text");

  return <ArkItemText {...dropAddress(props)} />;
}

/** Props of `RadioGroupItemControl`. */
export type RadioGroupItemControlProps = ArkItemControlProps;

/** One item's visible circle — the node a pointer clicks and the indicator sits inside. */
export function RadioGroupItemControl(props: RadioGroupItemControlProps) {
  traceLife("ui.radio-group-item-control");

  return <ArkItemControl {...dropAddress(props)} />;
}

/** Props of `RadioGroupItemHiddenInput`. */
export type RadioGroupItemHiddenInputProps = ArkItemHiddenInputProps;

/**
 * Each item's real, hidden `<input type="radio">` — for focus, form participation, and the
 * screen reader.
 *
 * Carries no address (`../entity/passport.ts`, "the hidden input, again"): a part the provider
 * never addressed is not addressable by us either.
 */
export function RadioGroupItemHiddenInput(props: RadioGroupItemHiddenInputProps) {
  traceLife("ui.radio-group-item-hidden-input");

  return <ArkItemHiddenInput {...dropAddress(props)} />;
}

/** Props of `RadioGroupIndicator`. */
export type RadioGroupIndicatorProps = ArkIndicatorProps;

/**
 * The single sliding indicator — ONE node, measured and positioned by the kit under whichever
 * item is chosen. No graphic of its own, the same device as the tabs' own sliding indicator.
 */
export function RadioGroupIndicator(props: RadioGroupIndicatorProps) {
  traceLife("ui.radio-group-indicator");

  return <ArkIndicator {...dropAddress(props)} />;
}

// MAP of the radio group: passport part → the component that draws it (`PWEB-84`).

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";

/**
 * The radio group's passport together with whatever draws each of its six parts.
 *
 * `itemHiddenInput` sits outside `parts` — it has no part in the passport (`../entity/
 * anatomy.ts`), and `parts`' keys are checked against the anatomy's parts, not against every node
 * the components render. It lives in `extras` instead (`PWEB-152`): a real, addressable-by-name-
 * only-not-by-anatomy component an assembly tree can still place — without it, a preview built
 * from an assembly renders the right look but a click never changes the chosen value: the real
 * `onChange` that drives `SET_VALUE` lives on this exact node, not on the label (`item`).
 */
export const kit = defineKitComponent(
  passport,
  {
    root: RadioGroup,
    label: RadioGroupLabel,
    item: RadioGroupItem,
    itemText: RadioGroupItemText,
    itemControl: RadioGroupItemControl,
    indicator: RadioGroupIndicator,
  },
  { hiddenInput: RadioGroupItemHiddenInput },
);
