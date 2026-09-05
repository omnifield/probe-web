export { Drawer, type DrawerProps } from "./root.js";
export { DrawerTrigger, type DrawerTriggerProps } from "./trigger.js";
export { DrawerBackdrop, type DrawerBackdropProps } from "./backdrop.js";
export { DrawerPositioner, type DrawerPositionerProps } from "./positioner.js";
export { DrawerSwipeArea, type DrawerSwipeAreaProps } from "./swipe-area.js";
export { DrawerContent, type DrawerContentProps } from "./content/index.js";
export { DrawerGrabber, type DrawerGrabberProps } from "./content/grabber.js";
export { DrawerGrabberIndicator, type DrawerGrabberIndicatorProps } from "./content/grabber-indicator.js";
export { DrawerTitle, type DrawerTitleProps } from "./content/title.js";
export { DrawerDescription, type DrawerDescriptionProps } from "./content/description.js";
export { DrawerCloseTrigger, type DrawerCloseTriggerProps } from "./content/close-trigger.js";

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { DrawerTrigger } from "./trigger.js";
import { DrawerBackdrop } from "./backdrop.js";
import { DrawerPositioner } from "./positioner.js";
import { DrawerSwipeArea } from "./swipe-area.js";
import { DrawerContent } from "./content/index.js";
import { DrawerGrabber } from "./content/grabber.js";
import { DrawerGrabberIndicator } from "./content/grabber-indicator.js";
import { DrawerTitle } from "./content/title.js";
import { DrawerDescription } from "./content/description.js";
import { DrawerCloseTrigger } from "./content/close-trigger.js";

export const kit = defineKitComponent(passport, {
  positioner: DrawerPositioner,
  content: DrawerContent,
  title: DrawerTitle,
  description: DrawerDescription,
  trigger: DrawerTrigger,
  backdrop: DrawerBackdrop,
  grabber: DrawerGrabber,
  grabberIndicator: DrawerGrabberIndicator,
  closeTrigger: DrawerCloseTrigger,
  swipeArea: DrawerSwipeArea,
});
