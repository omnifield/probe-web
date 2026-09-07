// What leaves this folder outward.
//
// Two different things, two different readers: MARKUP is picked up by the primitives entry
// (`src/index.ts`), the PASSPORT by the `./passport` build, which walks folders and assembles the
// list itself.

export {
  ScrollArea,
  ScrollAreaContent,
  type ScrollAreaContentProps,
  ScrollAreaCorner,
  type ScrollAreaCornerProps,
  type ScrollAreaProps,
  ScrollAreaRootProvider,
  type ScrollAreaRootProviderProps,
  ScrollAreaScrollbar,
  type ScrollAreaScrollbarProps,
  ScrollAreaThumb,
  type ScrollAreaThumbProps,
  ScrollAreaViewport,
  type ScrollAreaViewportProps,
  useScrollArea,
  useScrollAreaContext,
  type UseScrollAreaProps,
  type UseScrollAreaReturn,
} from "./components/index.js";
