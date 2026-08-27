import {
  DrawerBackdrop as ArkBackdrop,
  DrawerCloseTrigger as ArkCloseTrigger,
  DrawerContent as ArkContent,
  DrawerDescription as ArkDescription,
  DrawerGrabber as ArkGrabber,
  DrawerGrabberIndicator as ArkGrabberIndicator,
  DrawerPositioner as ArkPositioner,
  DrawerRoot as ArkRoot,
  DrawerSwipeArea as ArkSwipeArea,
  DrawerTitle as ArkTitle,
  DrawerTrigger as ArkTrigger,
  type DrawerBackdropProps as ArkBackdropProps,
  type DrawerCloseTriggerProps as ArkCloseTriggerProps,
  type DrawerContentProps as ArkContentProps,
  type DrawerDescriptionProps as ArkDescriptionProps,
  type DrawerGrabberIndicatorProps as ArkGrabberIndicatorProps,
  type DrawerGrabberProps as ArkGrabberProps,
  type DrawerPositionerProps as ArkPositionerProps,
  type DrawerRootProps as ArkRootProps,
  type DrawerSwipeAreaProps as ArkSwipeAreaProps,
  type DrawerTitleProps as ArkTitleProps,
  type DrawerTriggerProps as ArkTriggerProps,
} from "@ark-ui/solid/drawer";

import { dropAddress } from "../../slot-chain.js";
import { traceLife } from "../../trace.js";

// Drawer — a modal that slides in from an edge and can be swipe-dismissed, from Ark
// (`ark-ui.com/docs/components/drawer`).
//
// Same device as the rest of the Ark-provided kit: anatomy is Ark's (re-exported straight from
// `@zag-js/drawer`, `../entity/anatomy.ts`), the address is set by Ark itself (spreads
// `parts.*.attrs` inside every `getXxxProps()`, `drawer.connect.mjs`), wrappers are thin,
// `dropAddress` strips any address arriving from OUTSIDE so a node never lies about what it is
// (`PWEB-46`).
//
// `DrawerStack`/`DrawerIndent`/`DrawerIndentBackground` are deliberately NOT wrapped here — see
// `../entity/anatomy.ts` for why (a separate multi-drawer-stack API, no anatomy part at all).

/** Props of `Drawer` — the root. Renders NO node — pure context, the same situation the popover's/dialog's own root is in. */
export type DrawerProps = ArkRootProps;

/**
 * The drawer's root — holds the open state and the swipe/snap-point machinery. No DOM node of
 * its own.
 *
 * @example
 * ```tsx
 * <Drawer>
 *   <DrawerTrigger>Open</DrawerTrigger>
 *   <DrawerBackdrop />
 *   <DrawerPositioner>
 *     <DrawerContent>
 *       <DrawerGrabber>
 *         <DrawerGrabberIndicator />
 *       </DrawerGrabber>
 *       <DrawerTitle>Title</DrawerTitle>
 *       <DrawerDescription>Description</DrawerDescription>
 *       <DrawerCloseTrigger>Close</DrawerCloseTrigger>
 *     </DrawerContent>
 *   </DrawerPositioner>
 *   <DrawerSwipeArea />
 * </Drawer>
 * ```
 */
export function Drawer(props: DrawerProps) {
  traceLife("ui.drawer");

  return <ArkRoot {...dropAddress(props)} />;
}

/** Props of `DrawerTrigger`. */
export type DrawerTriggerProps = ArkTriggerProps;

/** Opens the drawer — a real `<button>`; `value` names WHICH drawer, in a multi-trigger composition. */
export function DrawerTrigger(props: DrawerTriggerProps) {
  traceLife("ui.drawer-trigger");

  return <ArkTrigger {...dropAddress(props)} />;
}

/** Props of `DrawerBackdrop`. */
export type DrawerBackdropProps = ArkBackdropProps;

/** The dimmed overlay behind the drawer — ONE node; fades with the swipe gesture (`--drawer-swipe-progress`). */
export function DrawerBackdrop(props: DrawerBackdropProps) {
  traceLife("ui.drawer-backdrop");

  return <ArkBackdrop {...dropAddress(props)} />;
}

/** Props of `DrawerPositioner`. */
export type DrawerPositionerProps = ArkPositionerProps;

/** Anchors `content` to the edge it slides from — ONE node. */
export function DrawerPositioner(props: DrawerPositionerProps) {
  traceLife("ui.drawer-positioner");

  return <ArkPositioner {...dropAddress(props)} />;
}

/** Props of `DrawerContent`. */
export type DrawerContentProps = ArkContentProps;

/**
 * The drawer's own panel — ONE node; the kit drives its slide/drag transform directly
 * (`transform: translate3d(var(--drawer-translate-x, 0px), var(--drawer-translate-y, 0px), 0)`).
 */
export function DrawerContent(props: DrawerContentProps) {
  traceLife("ui.drawer-content");

  return <ArkContent {...dropAddress(props)} />;
}

/** Props of `DrawerTitle`. */
export type DrawerTitleProps = ArkTitleProps;

/** The drawer's own title — ONE node, wired to `content` via `aria-labelledby`. */
export function DrawerTitle(props: DrawerTitleProps) {
  traceLife("ui.drawer-title");

  return <ArkTitle {...dropAddress(props)} />;
}

/** Props of `DrawerDescription`. */
export type DrawerDescriptionProps = ArkDescriptionProps;

/** The drawer's own description — ONE node, wired to `content` via `aria-describedby`. */
export function DrawerDescription(props: DrawerDescriptionProps) {
  traceLife("ui.drawer-description");

  return <ArkDescription {...dropAddress(props)} />;
}

/** Props of `DrawerCloseTrigger`. */
export type DrawerCloseTriggerProps = ArkCloseTriggerProps;

/** Closes the drawer — a real `<button>`, no graphic of its own. */
export function DrawerCloseTrigger(props: DrawerCloseTriggerProps) {
  traceLife("ui.drawer-close-trigger");

  return <ArkCloseTrigger {...dropAddress(props)} />;
}

/** Props of `DrawerGrabber`. */
export type DrawerGrabberProps = ArkGrabberProps;

/** The drag handle — ONE node inside `content`; a pointer-down here starts the swipe-to-dismiss gesture. */
export function DrawerGrabber(props: DrawerGrabberProps) {
  traceLife("ui.drawer-grabber");

  return <ArkGrabber {...dropAddress(props)} />;
}

/** Props of `DrawerGrabberIndicator`. */
export type DrawerGrabberIndicatorProps = ArkGrabberIndicatorProps;

/** The visible pull-bar INSIDE `grabber` — ONE node, no graphic of its own (a skin draws the bar). */
export function DrawerGrabberIndicator(props: DrawerGrabberIndicatorProps) {
  traceLife("ui.drawer-grabber-indicator");

  return <ArkGrabberIndicator {...dropAddress(props)} />;
}

/** Props of `DrawerSwipeArea`. */
export type DrawerSwipeAreaProps = ArkSwipeAreaProps;

/** An invisible (`aria-hidden`), edge-anchored gesture zone that lets a CLOSED drawer be swiped open. */
export function DrawerSwipeArea(props: DrawerSwipeAreaProps) {
  traceLife("ui.drawer-swipe-area");

  return <ArkSwipeArea {...dropAddress(props)} />;
}
