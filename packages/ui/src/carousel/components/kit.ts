// MAP of the carousel: passport part → the component that draws it (`PWEB-84`).
//
// All eleven parts are here, including the two Ark-only ones (`autoplayTrigger`... no —
// `progressText`/`autoplayIndicator`, `../entity/anatomy.ts`): unlike the field's `Item`, both
// genuinely carry an anatomy address, so both belong in the map the same as any Zag-backed part.

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import {
  Carousel,
  CarouselItemGroup,
  CarouselItem,
  CarouselControl,
  CarouselPrevTrigger,
  CarouselNextTrigger,
  CarouselIndicatorGroup,
  CarouselIndicator,
  CarouselAutoplayTrigger,
  CarouselProgressText,
  CarouselAutoplayIndicator,
} from "./index.jsx";

/** The carousel's passport together with whatever draws each of its eleven parts. */
export const kit = defineKitComponent(passport, {
  root: Carousel,
  itemGroup: CarouselItemGroup,
  item: CarouselItem,
  control: CarouselControl,
  prevTrigger: CarouselPrevTrigger,
  nextTrigger: CarouselNextTrigger,
  indicatorGroup: CarouselIndicatorGroup,
  indicator: CarouselIndicator,
  autoplayTrigger: CarouselAutoplayTrigger,
  progressText: CarouselProgressText,
  autoplayIndicator: CarouselAutoplayIndicator,
});
