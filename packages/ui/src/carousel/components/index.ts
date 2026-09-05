export { Carousel, type CarouselProps } from "./root.js";
export { CarouselProgressText, type CarouselProgressTextProps } from "./progress-text.js";
export { CarouselControl, type CarouselControlProps } from "./control/index.js";
export { CarouselPrevTrigger, type CarouselPrevTriggerProps } from "./control/prev-trigger.js";
export { CarouselNextTrigger, type CarouselNextTriggerProps } from "./control/next-trigger.js";
export { CarouselAutoplayTrigger, type CarouselAutoplayTriggerProps } from "./control/autoplay-trigger.js";
export { CarouselAutoplayIndicator, type CarouselAutoplayIndicatorProps } from "./control/autoplay-indicator.js";
export { CarouselItemGroup, type CarouselItemGroupProps } from "./item-group/index.js";
export { CarouselItem, type CarouselItemProps } from "./item-group/item.js";
export { CarouselIndicatorGroup, type CarouselIndicatorGroupProps } from "./indicator-group/index.js";
export { CarouselIndicator, type CarouselIndicatorProps } from "./indicator-group/indicator.js";

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { Carousel } from "./root.js";
import { CarouselProgressText } from "./progress-text.js";
import { CarouselControl } from "./control/index.js";
import { CarouselPrevTrigger } from "./control/prev-trigger.js";
import { CarouselNextTrigger } from "./control/next-trigger.js";
import { CarouselAutoplayTrigger } from "./control/autoplay-trigger.js";
import { CarouselAutoplayIndicator } from "./control/autoplay-indicator.js";
import { CarouselItemGroup } from "./item-group/index.js";
import { CarouselItem } from "./item-group/item.js";
import { CarouselIndicatorGroup } from "./indicator-group/index.js";
import { CarouselIndicator } from "./indicator-group/indicator.js";

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
