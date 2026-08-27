// What leaves this folder outward.
//
// Two different things, two different readers: MARKUP is picked up by the primitives entry
// (`src/index.ts`), the PASSPORT by the `./passport` build, which walks folders and assembles the
// list itself.

export {
  SegmentGroup,
  SegmentGroupIndicator,
  type SegmentGroupIndicatorProps,
  SegmentGroupItem,
  SegmentGroupItemControl,
  type SegmentGroupItemControlProps,
  SegmentGroupItemHiddenInput,
  type SegmentGroupItemHiddenInputProps,
  type SegmentGroupItemProps,
  SegmentGroupItemText,
  type SegmentGroupItemTextProps,
  SegmentGroupLabel,
  type SegmentGroupLabelProps,
  type SegmentGroupProps,
} from "./components/index.jsx";
export { kit } from "./components/kit.js";
export { anatomy, anatomyParts, passport } from "./entity";
