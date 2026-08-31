import {
  ToggleGroupItem as ArkItem,
  ToggleGroupRoot as ArkRoot,
  type ToggleGroupItemProps as ArkItemProps,
  type ToggleGroupRootProps as ArkRootProps,
} from "@ark-ui/solid/toggle-group";

import { dropAddress } from "../../utils/slot-chain.js";
import { traceLife } from "../../utils/trace.js";

// Toggle group — a row of buttons, one or several pressed at once, from Ark
// (`ark-ui.com/docs/components/toggle-group`).
//
// Same device as the rest of the Ark-provided kit: anatomy is Ark's (re-exported straight from
// `@zag-js/toggle-group`, `../entity/anatomy.ts`), the address is set by Ark itself (spreads
// `parts.*.attrs` inside every `getXxxProps()`, `toggle-group.connect.mjs`), wrappers are thin,
// `dropAddress` strips any address arriving from OUTSIDE so a node never lies about what it is
// (`PWEB-46`).
//
// Only two parts: no hidden input anywhere — each item IS the real, focusable control, a genuine
// `<button type="button">`, not a label wrapping one.

/** Props of `ToggleGroup` — the root. */
export type ToggleGroupProps = ArkRootProps;

/**
 * The set's root — holds the pressed value(s) (`value` / `defaultValue` / `onValueChange`),
 * `multiple`, and the orientation.
 *
 * @example
 * ```tsx
 * <ToggleGroup defaultValue={["bold"]} multiple>
 *   <ToggleGroupItem value="bold">B</ToggleGroupItem>
 *   <ToggleGroupItem value="italic">I</ToggleGroupItem>
 *   <ToggleGroupItem value="underline">U</ToggleGroupItem>
 * </ToggleGroup>
 * ```
 */
export function ToggleGroup(props: ToggleGroupProps) {
  traceLife("ui.toggle-group");

  return <ArkRoot {...dropAddress(props)} />;
}

/** Props of `ToggleGroupItem`. */
export type ToggleGroupItemProps = ArkItemProps;

/** One button — a real `<button type="button">` node; `value` is required. */
export function ToggleGroupItem(props: ToggleGroupItemProps) {
  traceLife("ui.toggle-group-item");

  return <ArkItem {...dropAddress(props)} />;
}

// MAP of the toggle group: passport part → the component that draws it (`PWEB-84`).

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";

/** The toggle group's passport together with whatever draws each of its two parts. */
export const kit = defineKitComponent(passport, {
  root: ToggleGroup,
  item: ToggleGroupItem,
});
