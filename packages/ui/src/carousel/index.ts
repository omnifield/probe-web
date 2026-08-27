// What leaves this folder outward.
//
// Two different things, two different readers: MARKUP is picked up by the primitives entry
// (`src/index.ts`), the PASSPORT by the `./passport` build, which walks folders and assembles the
// list itself.

export {
  Carousel,
  type CarouselProps,
  CarouselItemGroup,
  type CarouselItemGroupProps,
  CarouselItem,
  type CarouselItemProps,
  CarouselControl,
  type CarouselControlProps,
  CarouselPrevTrigger,
  type CarouselPrevTriggerProps,
  CarouselNextTrigger,
  type CarouselNextTriggerProps,
  CarouselIndicatorGroup,
  type CarouselIndicatorGroupProps,
  CarouselIndicator,
  type CarouselIndicatorProps,
  CarouselAutoplayTrigger,
  type CarouselAutoplayTriggerProps,
  CarouselProgressText,
  type CarouselProgressTextProps,
  CarouselAutoplayIndicator,
  type CarouselAutoplayIndicatorProps,
} from "./components/index.jsx";
export { kit } from "./components/kit.js";
export { anatomy, anatomyParts, passport } from "./entity";
