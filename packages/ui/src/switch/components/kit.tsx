import {
  SwitchRoot as ArkRoot,
  SwitchControl as ArkControl,
  SwitchThumb as ArkThumb,
  SwitchLabel as ArkLabel,
  SwitchHiddenInput as ArkHiddenInput,
  type SwitchRootProps as ArkRootProps,
  type SwitchControlProps as ArkControlProps,
  type SwitchThumbProps as ArkThumbProps,
  type SwitchLabelProps as ArkLabelProps,
  type SwitchHiddenInputProps as ArkHiddenInputProps,
} from "@ark-ui/solid/switch";

import { splitProps } from "solid-js";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

// Switch — a toggle, the same binary fact a checkbox holds, drawn as a track and a moving thumb
// instead of a check mark (`ark-ui.com/docs/components/switch`).
//
// Same device as the checkbox: anatomy is Ark's, the address is set by Ark itself (spreads
// `parts.*.attrs` inside every `getXxxProps()`, `switch.connect.mjs`), wrappers are thin,
// `dropAddress` strips any address arriving from OUTSIDE (by hand, or from an outer link in a
// composition) so a node never lies about what it is (`PWEB-46`).
//
// `HiddenInput` carries no address (`../entity/anatomy.ts`) — the real `<input type="checkbox">`
// it renders stays in the document for focus, form submission, and native `change`, but Ark never
// spreads an address onto it, the same as the checkbox's own hidden input.

/** Props of `Switch` — the root, a `<label>` wrapping the whole thing. */
export type SwitchProps = ArkRootProps;

/**
 * The switch's root — ONE `<label>` node plus context for its own parts.
 *
 * Holds the checked state (`checked` / `defaultChecked` / `onCheckedChange`).
 *
 * @example
 * ```tsx
 * <Switch>
 *   <SwitchControl>
 *     <SwitchThumb />
 *   </SwitchControl>
 *   <SwitchLabel>Enable feature</SwitchLabel>
 * </Switch>
 * ```
 */
export function Switch(props: SwitchProps) {
  traceLife("ui.switch");

  // Несёт свой скрытый `<input type="checkbox">` сам (постановка user, 2026-09-01, README
  // «`extras` — проверка по всему киту: кейса не нашлось ни одного») — он не берёт от сборки данных.
  const [local, rest] = splitProps(props, ["children"]);

  return (
    <ArkRoot {...dropAddress(rest)}>
      {local.children}
      <ArkHiddenInput />
    </ArkRoot>
  );
}

/** Props of `SwitchControl`. */
export type SwitchControlProps = ArkControlProps;

/** The track — ONE node, the visible background the thumb slides across. */
export function SwitchControl(props: SwitchControlProps) {
  traceLife("ui.switch-control");

  return <ArkControl {...dropAddress(props)} />;
}

/** Props of `SwitchThumb`. */
export type SwitchThumbProps = ArkThumbProps;

/** The moving indicator — ONE node; its position along the track is the skin's call. */
export function SwitchThumb(props: SwitchThumbProps) {
  traceLife("ui.switch-thumb");

  return <ArkThumb {...dropAddress(props)} />;
}

/** Props of `SwitchLabel`. */
export type SwitchLabelProps = ArkLabelProps;

/** The switch's label — ONE node. */
export function SwitchLabel(props: SwitchLabelProps) {
  traceLife("ui.switch-label");

  return <ArkLabel {...dropAddress(props)} />;
}

/** Props of `SwitchHiddenInput`. */
export type SwitchHiddenInputProps = ArkHiddenInputProps;

/**
 * The real, visually hidden `<input type="checkbox">` — focus, form submission, native `change`.
 *
 * Carries no address (`../entity/anatomy.ts`, "hiddenInput carries NO part"): a node the provider
 * does not address is not addressable by us either. `Switch` (above) already renders one of these
 * itself — this export stays for manual composition outside a schema, not for reuse there.
 */
export function SwitchHiddenInput(props: SwitchHiddenInputProps) {
  traceLife("ui.switch-hidden-input");

  return <ArkHiddenInput {...dropAddress(props)} />;
}

// MAP of the switch: passport part → the component that draws it (`PWEB-84`).
//
// НЕТ `hiddenInput` в карте (постановка user, 2026-09-01, README «`extras` — проверка по всему
// киту: кейса не нашлось ни одного») — он не берёт от сборки данных, `Switch` кладёт его сам.

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";

/** The switch's passport together with whatever draws each of its four parts. */
export const kit = defineKitComponent(passport, {
  root: Switch,
  control: SwitchControl,
  thumb: SwitchThumb,
  label: SwitchLabel,
});
