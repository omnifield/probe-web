import { Root as KobalteButton, type ButtonRootProps } from "@kobalte/core/button";
import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import type { ValidComponent } from "solid-js";

import { useAddress, useSlot, slotAware } from "../../utils/slot-chain.js";
import { traceLife } from "../../utils/trace.js";
import { anatomyParts } from "../entity/anatomy.js";

/**
 * Props of `Button`: everything the target element accepts, plus `as` and `disabled`.
 *
 * @typeParam T — what to render. Defaults to `button`.
 */
export type ButtonProps<T extends ValidComponent = "button"> = PolymorphicProps<
  T,
  ButtonRootProps<T>
>;

/**
 * A button — ONE node, a native `<button type="button">` by default.
 *
 * `@kobalte/core/button` (the WAI-ARIA Button pattern) does the work, exactly where a native
 * element falls short: with `as="div"`/`as="a"` it sets `role="button"`, `tabindex`, and
 * `aria-disabled` itself, and suppresses keyboard activation on a disabled button. That is why
 * this primitive sits on Kobalte rather than a bare `<button>`.
 *
 * `type="button"` by default is Kobalte's doing too: without it a button inside a form submits it
 * on the very first click — the most common hidden defect in buttons.
 *
 * **Zero styles.** There is no default class — the consumer styles it. The button gives the skin
 * an address through ANATOMY ATTRIBUTES (`data-scope=button` + `data-part=root`,
 * `entity/anatomy.ts`): the skin hooks in with a selector from that same declaration, so the two
 * cannot drift apart by construction. States are surfaced as attributes: `data-disabled`,
 * `aria-disabled`.
 *
 * **Loading** is deliberately not its own prop:
 * `<Button disabled aria-busy="true"><Spinner /></Button>` is assembled from what already exists,
 * and prop sugar would freeze into the surface a decision that a loading button hides its content
 * (which is exactly what a `loading` prop did in the prior design).
 *
 * @example
 * ```tsx
 * <Button onClick={save}>Save</Button>
 * <Button as="a" href="/docs">Documentation</Button>
 * <Button disabled aria-busy="true"><Spinner /></Button>
 * // The variant axis is an ATTRIBUTE, not a prop: `variant` does not typecheck, and the kit owns
 * // no variant name of its own (`entity/passport.ts`, `variantAxis`).
 * <Button data-variant="primary">Save</Button>
 * ```
 */
export const Button = slotAware(function Button<T extends ValidComponent = "button">(props: ButtonProps<T>) {
  traceLife("ui.button");

  const [slot, rest] = useSlot(props, "button");
  const [address, clean] = useAddress(rest, anatomyParts.root.attrs);

  // Spread order is part of the contract, and the two halves mean DIFFERENT things.
  //
  // `data-slot` goes FIRST: it is a default, and an explicit consumer hook is meant to override
  // it — hook names are a styling hint, not a promise about what the node is.
  //
  // The address goes LAST and is overridden by nothing (`PWEB-46`): it is the node's identity.
  // `useAddress` has already stripped any incoming address — no matter whether it came from the
  // consumer or from a foreign outer link spreading its own props onto an inserted button.
  //
  // The button only skips setting its own address when it is not the one drawing the node:
  // `<Button as={ToggleGroupItem}>` hands the address to the inner component — to whatever the
  // node visually is (`PWEB-25`).
  //
  // `data-slot` still sits next to the anatomy address: slot names are a zone commitment
  // (`PROBEWEB-12`, item 7) and cannot be dropped without a major version. It leaves once styling
  // moves onto anatomy addresses — that is an architect's release, not a side effect of a kit fix.
  return <KobalteButton {...slot} {...(clean as ButtonRootProps)} {...address} />;
});

// MAP of the button: passport part → the component that draws it (`PWEB-84`).
//
// One part, and the map looks redundant right up until the button gets a second one: it is
// added HERE then, not by twenty consumers separately.

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";

/** The button's passport together with whatever draws its single part. */
export const kit = defineKitComponent(passport, {
  root: Button,
});
