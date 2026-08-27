// What leaves this folder outward.
//
// Two different things, two different readers: MARKUP is picked up by the primitives entry
// (`src/index.ts`), the PASSPORT by the `./passport` build, which walks folders and assembles the
// list itself.

export {
  Drawer,
  DrawerBackdrop,
  type DrawerBackdropProps,
  DrawerCloseTrigger,
  type DrawerCloseTriggerProps,
  DrawerContent,
  type DrawerContentProps,
  DrawerDescription,
  type DrawerDescriptionProps,
  DrawerGrabber,
  DrawerGrabberIndicator,
  type DrawerGrabberIndicatorProps,
  type DrawerGrabberProps,
  DrawerPositioner,
  type DrawerPositionerProps,
  type DrawerProps,
  DrawerSwipeArea,
  type DrawerSwipeAreaProps,
  DrawerTitle,
  type DrawerTitleProps,
  DrawerTrigger,
  type DrawerTriggerProps,
} from "./components/index.jsx";
export { kit } from "./components/kit.js";
export { anatomy, anatomyParts, passport } from "./entity";
