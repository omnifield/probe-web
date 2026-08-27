// What leaves this folder outward.
//
// Two different things, two different readers: MARKUP is picked up by the primitives entry
// (`src/index.ts`), the PASSPORT by the `./passport` build, which walks folders and assembles the
// list itself.

export {
  Select,
  type SelectProps,
  SelectLabel,
  type SelectLabelProps,
  SelectControl,
  type SelectControlProps,
  SelectTrigger,
  type SelectTriggerProps,
  SelectValueText,
  type SelectValueTextProps,
  SelectClearTrigger,
  type SelectClearTriggerProps,
  SelectIndicator,
  type SelectIndicatorProps,
  SelectPositioner,
  type SelectPositionerProps,
  SelectContent,
  type SelectContentProps,
  SelectList,
  type SelectListProps,
  SelectItemGroup,
  type SelectItemGroupProps,
  SelectItemGroupLabel,
  type SelectItemGroupLabelProps,
  SelectItem,
  type SelectItemProps,
  SelectItemText,
  type SelectItemTextProps,
  SelectItemIndicator,
  type SelectItemIndicatorProps,
  SelectHiddenSelect,
  type SelectHiddenSelectProps,
  createListCollection,
  type CollectionItem,
  type ListCollection,
} from "./components/index.jsx";
export { kit } from "./components/kit.js";
export { anatomy, anatomyParts, passport } from "./entity";
