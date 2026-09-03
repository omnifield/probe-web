export { Popover, type PopoverProps } from "./root.js";
export { PopoverAnchor, type PopoverAnchorProps } from "./anchor.js";
export { PopoverTrigger, type PopoverTriggerProps } from "./trigger.js";
export { PopoverIndicator, type PopoverIndicatorProps } from "./indicator.js";
export { PopoverPositioner, type PopoverPositionerProps } from "./positioner.js";
export { PopoverArrow, type PopoverArrowProps } from "./arrow/index.js";
export { PopoverArrowTip, type PopoverArrowTipProps } from "./arrow/tip.js";
export { PopoverContent, type PopoverContentProps } from "./content/index.js";
export { PopoverTitle, type PopoverTitleProps } from "./content/title.js";
export { PopoverDescription, type PopoverDescriptionProps } from "./content/description.js";
export { PopoverCloseTrigger, type PopoverCloseTriggerProps } from "./content/close-trigger.js";

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { Popover } from "./root.js";
import { PopoverAnchor } from "./anchor.js";
import { PopoverTrigger } from "./trigger.js";
import { PopoverIndicator } from "./indicator.js";
import { PopoverPositioner } from "./positioner.js";
import { PopoverArrow } from "./arrow/index.js";
import { PopoverArrowTip } from "./arrow/tip.js";
import { PopoverContent } from "./content/index.js";
import { PopoverTitle } from "./content/title.js";
import { PopoverDescription } from "./content/description.js";
import { PopoverCloseTrigger } from "./content/close-trigger.js";

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
