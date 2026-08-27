import {
  ToggleIndicator as ArkIndicator,
  ToggleRoot as ArkRoot,
  type ToggleIndicatorProps as ArkIndicatorProps,
  type ToggleRootProps as ArkRootProps,
} from "@ark-ui/solid/toggle";

import { dropAddress } from "../../slot-chain.js";
import { traceLife } from "../../trace.js";

// Toggle — a single pressed/unpressed button, from Ark (`ark-ui.com/docs/components/toggle`).
//
// Same device as the rest of the Ark-provided kit: anatomy is Ark's (re-exported through
// `../entity/anatomy.ts`), the address is set by Ark itself (spreads `parts.*.attrs` inside every
// `getXxxProps()`, `toggle.connect.mjs`), wrappers are thin, `dropAddress` strips any address
// arriving from OUTSIDE so a node never lies about what it is (`PWEB-46`).
//
// NOT the same component as `../../toggle.tsx` — the older, Kobalte-backed flat-file primitive
// already exported from `../../index.ts`. Same English word, unrelated modules.

/** Props of `Toggle` — the root. */
export type ToggleProps = ArkRootProps;

/**
 * The toggle's root — ONE real `<button aria-pressed>`, wraps `indicator`.
 *
 * `pressed`/`defaultPressed`/`onPressedChange` come straight through from Ark: controlled and
 * uncontrolled both work, the same split every other Ark-backed root in this kit follows.
 *
 * @example
 * ```tsx
 * <Toggle>
 *   <ToggleIndicator>★</ToggleIndicator>
 * </Toggle>
 * ```
 */
export function Toggle(props: ToggleProps) {
  traceLife("ui.toggle");

  return <ArkRoot {...dropAddress(props)} />;
}

/** Props of `ToggleIndicator`. */
export type ToggleIndicatorProps = ArkIndicatorProps;

/** The glyph shown inside the button — an icon, a checkmark, whatever the consumer puts inside it. */
export function ToggleIndicator(props: ToggleIndicatorProps) {
  traceLife("ui.toggle-indicator");

  return <ArkIndicator {...dropAddress(props)} />;
}
