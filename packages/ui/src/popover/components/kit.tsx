import {
  PopoverRoot as ArkRoot,
  PopoverAnchor as ArkAnchor,
  PopoverTrigger as ArkTrigger,
  PopoverIndicator as ArkIndicator,
  PopoverPositioner as ArkPositioner,
  PopoverArrow as ArkArrow,
  PopoverArrowTip as ArkArrowTip,
  PopoverContent as ArkContent,
  PopoverTitle as ArkTitle,
  PopoverDescription as ArkDescription,
  PopoverCloseTrigger as ArkCloseTrigger,
  type PopoverRootProps as ArkRootProps,
  type PopoverAnchorProps as ArkAnchorProps,
  type PopoverTriggerProps as ArkTriggerProps,
  type PopoverIndicatorProps as ArkIndicatorProps,
  type PopoverPositionerProps as ArkPositionerProps,
  type PopoverArrowProps as ArkArrowProps,
  type PopoverArrowTipProps as ArkArrowTipProps,
  type PopoverContentProps as ArkContentProps,
  type PopoverTitleProps as ArkTitleProps,
  type PopoverDescriptionProps as ArkDescriptionProps,
  type PopoverCloseTriggerProps as ArkCloseTriggerProps,
} from "@ark-ui/solid/popover";

import { dropAddress } from "../../utils/slot-chain.js";
import { traceLife } from "../../utils/trace.js";

// Popover — a floating panel anchored to a trigger, with its own title/description/close button
// (`ark-ui.com/docs/components/popover`).
//
// Same device as the rest of the Ark-provided kit for the parts that HAVE an address: Ark sets it
// itself (spreads `parts.*.attrs` inside every `getXxxProps()`, `popover.connect.mjs`), wrappers
// are thin, `dropAddress` strips any address arriving from OUTSIDE so a node never lies about
// what it is (`PWEB-46`).
//
// `Popover` (the root) is the ONE exception: it renders NO DOM node of its own at all — pure
// context, nothing for `dropAddress` to act on (`../entity/anatomy.ts`/`../entity/passport.ts`
// explain why there is no `root` part in the anatomy either). Its wrapper below passes `props`
// straight through, unlike every other root in the kit.

/** Props of `Popover` — the root. Renders NO node of its own; pure context for its parts. */
export type PopoverProps = ArkRootProps;

/**
 * The popover's context provider — holds the open state (`open` / `defaultOpen` /
 * `onOpenChange`) and behavior (`modal`, `portalled`, `closeOnEscape`, …). Renders nothing
 * itself: `trigger`/`anchor`/`positioner` are its real DOM siblings, not its children.
 *
 * @example
 * ```tsx
 * <Popover>
 *   <PopoverTrigger>Open</PopoverTrigger>
 *   <PopoverPositioner>
 *     <PopoverContent>
 *       <PopoverTitle>Title</PopoverTitle>
 *       <PopoverDescription>Details go here.</PopoverDescription>
 *       <PopoverCloseTrigger>Close</PopoverCloseTrigger>
 *     </PopoverContent>
 *     <PopoverArrow>
 *       <PopoverArrowTip />
 *     </PopoverArrow>
 *   </PopoverPositioner>
 * </Popover>
 * ```
 */
export function Popover(props: PopoverProps) {
  traceLife("ui.popover");

  return <ArkRoot {...props} />;
}

/** Props of `PopoverAnchor`. */
export type PopoverAnchorProps = ArkAnchorProps;

/** Optional reference point the popover positions against, instead of the trigger — ONE node. */
export function PopoverAnchor(props: PopoverAnchorProps) {
  traceLife("ui.popover-anchor");

  return <ArkAnchor {...dropAddress(props)} />;
}

/** Props of `PopoverTrigger`. */
export type PopoverTriggerProps = ArkTriggerProps;

/** Opens and closes the popover — ONE real `<button>` node. */
export function PopoverTrigger(props: PopoverTriggerProps) {
  traceLife("ui.popover-trigger");

  return <ArkTrigger {...dropAddress(props)} />;
}

/** Props of `PopoverIndicator`. */
export type PopoverIndicatorProps = ArkIndicatorProps;

/** Open/closed indicator — ONE node, the consumer places the glyph. */
export function PopoverIndicator(props: PopoverIndicatorProps) {
  traceLife("ui.popover-indicator");

  return <ArkIndicator {...dropAddress(props)} />;
}

/** Props of `PopoverPositioner`. */
export type PopoverPositionerProps = ArkPositionerProps;

/** Positions the floating content relative to the trigger (or the anchor) — ONE node. */
export function PopoverPositioner(props: PopoverPositionerProps) {
  traceLife("ui.popover-positioner");

  return <ArkPositioner {...dropAddress(props)} />;
}

/** Props of `PopoverArrow`. */
export type PopoverArrowProps = ArkArrowProps;

/** Outer clipping box for the pointing arrow — ONE node; wraps `PopoverArrowTip`. */
export function PopoverArrow(props: PopoverArrowProps) {
  traceLife("ui.popover-arrow");

  return <ArkArrow {...dropAddress(props)} />;
}

/** Props of `PopoverArrowTip`. */
export type PopoverArrowTipProps = ArkArrowTipProps;

/** The arrow's actual point — ONE node, rotated into a diamond by the kit's own positioning. */
export function PopoverArrowTip(props: PopoverArrowTipProps) {
  traceLife("ui.popover-arrow-tip");

  return <ArkArrowTip {...dropAddress(props)} />;
}

/** Props of `PopoverContent`. */
export type PopoverContentProps = ArkContentProps;

/** The floating panel itself — ONE node; hidden, not removed, while closed. */
export function PopoverContent(props: PopoverContentProps) {
  traceLife("ui.popover-content");

  return <ArkContent {...dropAddress(props)} />;
}

/** Props of `PopoverTitle`. */
export type PopoverTitleProps = ArkTitleProps;

/** The panel's heading — ONE node. */
export function PopoverTitle(props: PopoverTitleProps) {
  traceLife("ui.popover-title");

  return <ArkTitle {...dropAddress(props)} />;
}

/** Props of `PopoverDescription`. */
export type PopoverDescriptionProps = ArkDescriptionProps;

/** The panel's body text — ONE node. */
export function PopoverDescription(props: PopoverDescriptionProps) {
  traceLife("ui.popover-description");

  return <ArkDescription {...dropAddress(props)} />;
}

/** Props of `PopoverCloseTrigger`. */
export type PopoverCloseTriggerProps = ArkCloseTriggerProps;

/** Closes the popover — ONE real `<button>` node. */
export function PopoverCloseTrigger(props: PopoverCloseTriggerProps) {
  traceLife("ui.popover-close-trigger");

  return <ArkCloseTrigger {...dropAddress(props)} />;
}

// MAP of the popover: passport part → the component that draws it (`PWEB-84`).
//
// `Popover` (the root) is not in `parts`: it carries no anatomy part at all (`../entity/
// anatomy.ts`), and `parts`' keys are checked against anatomy parts, not against every rendered
// component. It is the passport's `provider` instead (`PWEB-153`): the invisible context that
// `positioner` (the passport's chosen stand-in root) needs to read — without it, mounting
// `positioner` on its own throws, since Ark's own context is never established.

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";

/** The popover's passport together with whatever draws each of its ten parts. */
export const kit = defineKitComponent(
  passport,
  {
    arrow: PopoverArrow,
    arrowTip: PopoverArrowTip,
    anchor: PopoverAnchor,
    trigger: PopoverTrigger,
    indicator: PopoverIndicator,
    positioner: PopoverPositioner,
    content: PopoverContent,
    title: PopoverTitle,
    description: PopoverDescription,
    closeTrigger: PopoverCloseTrigger,
  },
  Popover,
);
