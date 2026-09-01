import {
  ScrollAreaContent as ArkContent,
  ScrollAreaCorner as ArkCorner,
  ScrollAreaRoot as ArkRoot,
  ScrollAreaScrollbar as ArkScrollbar,
  ScrollAreaThumb as ArkThumb,
  ScrollAreaViewport as ArkViewport,
  type ScrollAreaContentProps as ArkContentProps,
  type ScrollAreaCornerProps as ArkCornerProps,
  type ScrollAreaRootProps as ArkRootProps,
  type ScrollAreaScrollbarProps as ArkScrollbarProps,
  type ScrollAreaThumbProps as ArkThumbProps,
  type ScrollAreaViewportProps as ArkViewportProps,
} from "@ark-ui/solid/scroll-area";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

// Scroll area — a scrollable region with its own (skinnable) scrollbar, from Ark
// (`ark-ui.com/docs/components/scroll-area`).
//
// Same device as the rest of the Ark-provided kit: anatomy is Ark's (re-exported straight from
// `@zag-js/scroll-area`, `../entity/anatomy.ts`), the address is set by Ark itself (spreads
// `parts.*.attrs` inside every `getXxxProps()`, `scroll-area.connect.mjs`), wrappers are thin,
// `dropAddress` strips any address arriving from OUTSIDE so a node never lies about what it is
// (`PWEB-46`).
//
// `ScrollAreaScrollbar`/`ScrollAreaThumb` each render TWICE in a two-axis scroll area — once per
// `orientation` — not a special case, the same repeated-part shape the tabs' own trigger has.

/** Props of `ScrollArea` — the root. */
export type ScrollAreaProps = ArkRootProps;

/**
 * The scroll area's root — sizes the visible window and holds the four measured CSS custom
 * properties (`--corner-width`/`--corner-height`/`--thumb-width`/`--thumb-height`) that
 * `scrollbar`/`thumb`/`corner` read from, further down the tree.
 *
 * @example
 * ```tsx
 * <ScrollArea>
 *   <ScrollAreaViewport>
 *     <ScrollAreaContent>Long content…</ScrollAreaContent>
 *   </ScrollAreaViewport>
 *   <ScrollAreaScrollbar orientation="vertical">
 *     <ScrollAreaThumb orientation="vertical" />
 *   </ScrollAreaScrollbar>
 *   <ScrollAreaScrollbar orientation="horizontal">
 *     <ScrollAreaThumb orientation="horizontal" />
 *   </ScrollAreaScrollbar>
 *   <ScrollAreaCorner />
 * </ScrollArea>
 * ```
 */
export function ScrollArea(props: ScrollAreaProps) {
  traceLife("ui.scroll-area");

  return <ArkRoot {...dropAddress(props)} />;
}

/** Props of `ScrollAreaViewport`. */
export type ScrollAreaViewportProps = ArkViewportProps;

/** The clipping window — ONE node; native `overflow: auto`, real scroll events. */
export function ScrollAreaViewport(props: ScrollAreaViewportProps) {
  traceLife("ui.scroll-area-viewport");

  return <ArkViewport {...dropAddress(props)} />;
}

/** Props of `ScrollAreaContent`. */
export type ScrollAreaContentProps = ArkContentProps;

/** The scrollable content itself — ONE node, sized to fit whatever the consumer puts inside it. */
export function ScrollAreaContent(props: ScrollAreaContentProps) {
  traceLife("ui.scroll-area-content");

  return <ArkContent {...dropAddress(props)} />;
}

/** Props of `ScrollAreaScrollbar`. */
export type ScrollAreaScrollbarProps = ArkScrollbarProps;

/** One axis's track — `orientation` is required; render one per axis the scroll area allows. */
export function ScrollAreaScrollbar(props: ScrollAreaScrollbarProps) {
  traceLife("ui.scroll-area-scrollbar");

  return <ArkScrollbar {...dropAddress(props)} />;
}

/** Props of `ScrollAreaThumb`. */
export type ScrollAreaThumbProps = ArkThumbProps;

/** One axis's own drag handle — `orientation` is required, matches its scrollbar's own. */
export function ScrollAreaThumb(props: ScrollAreaThumbProps) {
  traceLife("ui.scroll-area-thumb");

  return <ArkThumb {...dropAddress(props)} />;
}

/** Props of `ScrollAreaCorner`. */
export type ScrollAreaCornerProps = ArkCornerProps;

/** The square where two scrollbars would otherwise overlap — ONE node; `data-state="hidden"` when only one axis scrolls, hiding it is a skin decision, not the kit's own. */
export function ScrollAreaCorner(props: ScrollAreaCornerProps) {
  traceLife("ui.scroll-area-corner");

  return <ArkCorner {...dropAddress(props)} />;
}

// MAP of the scroll area: passport part → the component that draws it (`PWEB-84`).

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";

/** The scroll area's passport together with whatever draws each of its six parts. */
export const kit = defineKitComponent(passport, {
  root: ScrollArea,
  viewport: ScrollAreaViewport,
  content: ScrollAreaContent,
  scrollbar: ScrollAreaScrollbar,
  thumb: ScrollAreaThumb,
  corner: ScrollAreaCorner,
});
