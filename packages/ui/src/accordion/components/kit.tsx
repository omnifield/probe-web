import {
  AccordionItem as ArkItem,
  AccordionItemContent as ArkItemContent,
  AccordionItemIndicator as ArkItemIndicator,
  AccordionItemTrigger as ArkItemTrigger,
  type AccordionItemContentProps as ArkItemContentProps,
  type AccordionItemIndicatorProps as ArkItemIndicatorProps,
  type AccordionItemProps as ArkItemProps,
  type AccordionItemTriggerProps as ArkItemTriggerProps,
  AccordionRoot as ArkRoot,
  type AccordionRootProps as ArkRootProps,
} from "@ark-ui/solid/accordion";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

// Disclosure items — the FIRST component the kit took from Ark UI (`PWEB-37`).
//
// ## What changed compared to the previous accordion
//
// The previous one stood on `@kobalte/core` and carried `data-slot` hooks. This one stands on
// `@ark-ui/solid`, and is addressed by ANATOMY — `data-scope="accordion"` plus `data-part` — set
// not by our wrapper, but by Ark itself. That is, the "kit ↔ skin" seam is closed by
// construction here: one `@zag-js/anatomy` declaration produces both the address and the
// selector, and there is nowhere for them to drift apart.
//
// The accordion therefore carries NO `data-slot` hooks at all, and that is a decision, not an
// oversight: giving a new component addresses for the mechanism being retired would expand
// exactly what we are moving away from. The previous names (`accordion`, `accordion-header`,
// `accordion-trigger`, …) were removed together with the previous component — they had no
// consumers, checked by walking the tree.
//
// ## Ark sets the address, and we do not let it be overridden
//
// Ark itself puts the attributes on the node, but it spreads the consumer's props AFTER its own —
// meaning a hand-written `data-scope` would win, and the node would lie about what it is.
// `PWEB-46`'s decision applies to the whole kit, not only to components whose address we set
// ourselves, so the wrappers strip any foreign address from props (`dropAddress`) and hand Ark
// everything else as is.
//
// ## Five parts, and a header is not one of them
//
// `root · item · itemTrigger · itemContent · itemIndicator` — the list arrives ready-made, we
// declare no anatomy of our own. Ark has no header part, and that is not a kit gap: the
// WAI-ARIA pattern asks for the item's trigger to be wrapped in a heading of the right LEVEL, and
// the level depends on the page's own structure, known only to the consumer. The wrapper is
// their node:
//
//     <h3><AccordionItemTrigger>Shipping</AccordionItemTrigger></h3>
//
// ## A collapsed item stays in the document
//
// The previous accordion REMOVED collapsed content. This one hides it: the node stays, with
// `hidden` and `data-state="closed"`. For styling this is a difference of substance — a node
// that does not exist can be neither animated nor measured — and it is named here so it does not
// surface as a surprise on the first transition.
//
// Zag measures the height itself and hands it back as custom properties `--height` / `--width`
// on the content node; how to express it — a transition, `grid-template-rows`, nothing — is the
// skin's call. The kit brings no animation of its own, same as before.

/** Props of `Accordion` — the root of the item set. */
export type AccordionProps = ArkRootProps;

/**
 * The set's root — ONE node plus context.
 *
 * Holds the expanded items (`value` / `defaultValue` / `onValueChange`), `multiple` (can several
 * stay expanded at once), and `collapsible` (can the last expanded one be closed).
 *
 * @example
 * ```tsx
 * <Accordion multiple defaultValue={["shipping"]}>
 *   <AccordionItem value="shipping">
 *     <h3>
 *       <AccordionItemTrigger>
 *         Shipping
 *         <AccordionItemIndicator>▾</AccordionItemIndicator>
 *       </AccordionItemTrigger>
 *     </h3>
 *     <AccordionItemContent>Courier and pickup</AccordionItemContent>
 *   </AccordionItem>
 * </Accordion>
 * ```
 */
export function Accordion(props: AccordionProps) {
  traceLife("ui.accordion");

  return <ArkRoot {...dropAddress(props)} />;
}

/** Props of `AccordionItem`. */
export type AccordionItemProps = ArkItemProps;

/**
 * One item — ONE node plus context for its own parts. `value` is required.
 *
 * The item is exactly the reason the accordion was taken as the first composite component: it
 * has several nodes, one skin coordinate, and once dressed, every item is dressed at once.
 */
export function AccordionItem(props: AccordionItemProps) {
  traceLife("ui.accordion-item");

  return <ArkItem {...dropAddress(props)} />;
}

/** Props of `AccordionItemTrigger`. */
export type AccordionItemTriggerProps = ArkItemTriggerProps;

/**
 * The expansion button — ONE `<button>` node.
 *
 * State arrives as `data-state="open" | "closed"`, disabledness as the native `disabled`
 * (Zag sets it on the button, not `data-disabled`), focus as `data-focus`.
 */
export function AccordionItemTrigger(props: AccordionItemTriggerProps) {
  traceLife("ui.accordion-item-trigger");

  return <ArkItemTrigger {...dropAddress(props)} />;
}

/** Props of `AccordionItemContent`. */
export type AccordionItemContentProps = ArkItemContentProps;

/** An item's content — ONE node; when collapsed it is hidden, not removed. */
export function AccordionItemContent(props: AccordionItemContentProps) {
  traceLife("ui.accordion-item-content");

  return <ArkItemContent {...dropAddress(props)} />;
}

/** Props of `AccordionItemIndicator`. */
export type AccordionItemIndicatorProps = ArkItemIndicatorProps;

/**
 * The expansion indicator — ONE node, hidden from screen readers (`aria-hidden`).
 *
 * The consumer places an arrow inside it: the kit brings no graphic of its own. Rotation is the
 * skin's job, which is exactly why the expansion state is declared on the indicator itself.
 */
export function AccordionItemIndicator(props: AccordionItemIndicatorProps) {
  traceLife("ui.accordion-item-indicator");

  return <ArkItemIndicator {...dropAddress(props)} />;
}

// MAP of the accordion: passport part → the component that draws it (`PWEB-84`).
//
// Here it is clear why the map exists at all: the accordion has five parts, and flat kit names
// match none of them except the root. Had a consumer assembled such a map themselves, they would
// have guessed how `itemTrigger` turns into `AccordionItemTrigger` — a guess right up until the
// first part named differently.
//
// There is no separate list of parts here: keys are checked against the anatomy — by type while
// writing, and by `defineKitComponent` at runtime.

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";

/** The accordion's passport together with whatever draws each of its parts. */
export const kit = defineKitComponent(passport, {
  root: Accordion,
  item: AccordionItem,
  itemTrigger: AccordionItemTrigger,
  itemContent: AccordionItemContent,
  itemIndicator: AccordionItemIndicator,
});
