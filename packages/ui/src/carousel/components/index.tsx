import {
  CarouselRoot as ArkRoot,
  CarouselItemGroup as ArkItemGroup,
  CarouselItem as ArkItem,
  CarouselControl as ArkControl,
  CarouselPrevTrigger as ArkPrevTrigger,
  CarouselNextTrigger as ArkNextTrigger,
  CarouselIndicatorGroup as ArkIndicatorGroup,
  CarouselIndicator as ArkIndicator,
  CarouselAutoplayTrigger as ArkAutoplayTrigger,
  CarouselProgressText as ArkProgressText,
  CarouselAutoplayIndicator as ArkAutoplayIndicator,
  type CarouselRootProps as ArkRootProps,
  type CarouselItemGroupProps as ArkItemGroupProps,
  type CarouselItemProps as ArkItemProps,
  type CarouselControlProps as ArkControlProps,
  type CarouselPrevTriggerProps as ArkPrevTriggerProps,
  type CarouselNextTriggerProps as ArkNextTriggerProps,
  type CarouselIndicatorGroupProps as ArkIndicatorGroupProps,
  type CarouselIndicatorProps as ArkIndicatorProps,
  type CarouselAutoplayTriggerProps as ArkAutoplayTriggerProps,
  type CarouselProgressTextProps as ArkProgressTextProps,
  type CarouselAutoplayIndicatorProps as ArkAutoplayIndicatorProps,
} from "@ark-ui/solid/carousel";

import { dropAddress } from "../../slot-chain.js";
import { traceLife } from "../../trace.js";

// Carousel — one slide in view at a time (or several, via `slidesPerPage`), scrolled by trigger,
// drag, wheel, or autoplay (`ark-ui.com/docs/components/carousel`).
//
// Same device as the rest of the Ark-provided kit: anatomy is Ark's, the address is set by Ark
// itself (spreads `parts.*.attrs` inside every `getXxxProps()`, `carousel.connect.mjs`), wrappers
// are thin, `dropAddress` strips any address arriving from OUTSIDE so a node never lies about
// what it is (`PWEB-46`).
//
// `CarouselProgressText`/`CarouselAutoplayIndicator` are the two Ark-only parts (`../entity/
// anatomy.ts` explains why they exist at all): both DO carry a real anatomy address, unlike the
// field's own `Item`, but both also carry a KIND OF DEFAULT CONTENT the field's parts never had —
// `ProgressText` fills itself with `"<page> / <total>"` when given no children, and
// `AutoplayIndicator` switches between `children` (while playing) and its own `fallback` prop
// (while paused). Neither wrapper below changes that: `dropAddress` only ever touches the
// address, never the children/fallback logic Ark already wrote.
//
// Our own naming is fully prefixed throughout (`CarouselItemGroup`, not `ItemGroup`) — the same
// discipline `AccordionItem`/`CheckboxControl`/`TabsTrigger` already stand on, regardless of
// which prefix shape Ark's own exports happen to use.

/** Props of `Carousel` — the root. */
export type CarouselProps = ArkRootProps;

/**
 * The carousel's root — holds the current page (`page` / `defaultPage` / `onPageChange`), the
 * slide count, and the layout settings (`slidesPerPage`, `spacing`, `orientation`, …).
 *
 * @example
 * ```tsx
 * <Carousel slideCount={items.length}>
 *   <CarouselControl>
 *     <CarouselPrevTrigger>‹</CarouselPrevTrigger>
 *     <CarouselNextTrigger>›</CarouselNextTrigger>
 *   </CarouselControl>
 *   <CarouselItemGroup>
 *     <For each={items}>{(item, index) => <CarouselItem index={index()}>{item}</CarouselItem>}</For>
 *   </CarouselItemGroup>
 *   <CarouselIndicatorGroup>
 *     <For each={items}>{(_item, index) => <CarouselIndicator index={index()} />}</For>
 *   </CarouselIndicatorGroup>
 * </Carousel>
 * ```
 */
export function Carousel(props: CarouselProps) {
  traceLife("ui.carousel");

  return <ArkRoot {...dropAddress(props)} />;
}

/** Props of `CarouselItemGroup`. */
export type CarouselItemGroupProps = ArkItemGroupProps;

/** Wraps the slides — ONE node, the scrollable viewport. */
export function CarouselItemGroup(props: CarouselItemGroupProps) {
  traceLife("ui.carousel-item-group");

  return <ArkItemGroup {...dropAddress(props)} />;
}

/** Props of `CarouselItem`. */
export type CarouselItemProps = ArkItemProps;

/** One slide — ONE node; `index` is required. */
export function CarouselItem(props: CarouselItemProps) {
  traceLife("ui.carousel-item");

  return <ArkItem {...dropAddress(props)} />;
}

/** Props of `CarouselControl`. */
export type CarouselControlProps = ArkControlProps;

/** Wraps the previous/next buttons — ONE node, no behavior of its own. */
export function CarouselControl(props: CarouselControlProps) {
  traceLife("ui.carousel-control");

  return <ArkControl {...dropAddress(props)} />;
}

/** Props of `CarouselPrevTrigger`. */
export type CarouselPrevTriggerProps = ArkPrevTriggerProps;

/** Scrolls to the previous page — ONE real `<button>` node, disabled at the start unless `loop`. */
export function CarouselPrevTrigger(props: CarouselPrevTriggerProps) {
  traceLife("ui.carousel-prev-trigger");

  return <ArkPrevTrigger {...dropAddress(props)} />;
}

/** Props of `CarouselNextTrigger`. */
export type CarouselNextTriggerProps = ArkNextTriggerProps;

/** Scrolls to the next page — ONE real `<button>` node, disabled at the end unless `loop`. */
export function CarouselNextTrigger(props: CarouselNextTriggerProps) {
  traceLife("ui.carousel-next-trigger");

  return <ArkNextTrigger {...dropAddress(props)} />;
}

/** Props of `CarouselIndicatorGroup`. */
export type CarouselIndicatorGroupProps = ArkIndicatorGroupProps;

/** Wraps the page indicators — ONE node. */
export function CarouselIndicatorGroup(props: CarouselIndicatorGroupProps) {
  traceLife("ui.carousel-indicator-group");

  return <ArkIndicatorGroup {...dropAddress(props)} />;
}

/** Props of `CarouselIndicator`. */
export type CarouselIndicatorProps = ArkIndicatorProps;

/** One page indicator — ONE real `<button>` node; `index` is required. */
export function CarouselIndicator(props: CarouselIndicatorProps) {
  traceLife("ui.carousel-indicator");

  return <ArkIndicator {...dropAddress(props)} />;
}

/** Props of `CarouselAutoplayTrigger`. */
export type CarouselAutoplayTriggerProps = ArkAutoplayTriggerProps;

/** Starts/pauses autoplay — ONE real `<button>` node. */
export function CarouselAutoplayTrigger(props: CarouselAutoplayTriggerProps) {
  traceLife("ui.carousel-autoplay-trigger");

  return <ArkAutoplayTrigger {...dropAddress(props)} />;
}

/** Props of `CarouselProgressText`. */
export type CarouselProgressTextProps = ArkProgressTextProps;

/**
 * Page count text — ONE node; fills itself with `"<page> / <total>"` when given no children.
 */
export function CarouselProgressText(props: CarouselProgressTextProps) {
  traceLife("ui.carousel-progress-text");

  return <ArkProgressText {...dropAddress(props)} />;
}

/** Props of `CarouselAutoplayIndicator`. */
export type CarouselAutoplayIndicatorProps = ArkAutoplayIndicatorProps;

/**
 * Shows `children` while autoplay is running, the `fallback` prop while it is paused — ONE node,
 * always mounted; only its content switches.
 */
export function CarouselAutoplayIndicator(props: CarouselAutoplayIndicatorProps) {
  traceLife("ui.carousel-autoplay-indicator");

  return <ArkAutoplayIndicator {...dropAddress(props)} />;
}
