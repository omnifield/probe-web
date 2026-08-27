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
  ScrollAreaScrollbar,
  type ScrollAreaScrollbarProps,
  ScrollAreaThumb,
  type ScrollAreaThumbProps,
  ScrollAreaViewport,
  type ScrollAreaViewportProps,
} from "./components/index.jsx";
export { kit } from "./components/kit.js";
export { anatomy, anatomyParts, passport } from "./entity";
