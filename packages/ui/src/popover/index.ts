// What leaves this folder outward.
//
// Two different things, two different readers: MARKUP is picked up by the primitives entry
// (`src/index.ts`), the PASSPORT by the `./passport` build, which walks folders and assembles the
// list itself.

export {
  Popover,
  type PopoverProps,
  PopoverAnchor,
  type PopoverAnchorProps,
  PopoverControl,
  type PopoverControlProps,
  PopoverControlIndicator,
  type PopoverControlIndicatorProps,
  PopoverPositioner,
  type PopoverPositionerProps,
  PopoverArrow,
  type PopoverArrowProps,
  PopoverArrowTip,
  type PopoverArrowTipProps,
  PopoverContent,
  type PopoverContentProps,
  PopoverTitle,
  type PopoverTitleProps,
  PopoverDescription,
  type PopoverDescriptionProps,
  PopoverCloseTrigger,
  type PopoverCloseTriggerProps,
} from "./components/index.js";
