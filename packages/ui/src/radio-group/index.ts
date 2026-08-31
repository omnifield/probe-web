// What leaves this folder outward.
//
// Two different things, two different readers: MARKUP is picked up by the primitives entry
// (`src/index.ts`), the PASSPORT by the `./passport` build, which walks folders and assembles the
// list itself.

export {
  RadioGroup,
  RadioGroupIndicator,
  type RadioGroupIndicatorProps,
  RadioGroupItem,
  RadioGroupItemControl,
  type RadioGroupItemControlProps,
  RadioGroupItemHiddenInput,
  type RadioGroupItemHiddenInputProps,
  type RadioGroupItemProps,
  RadioGroupItemText,
  type RadioGroupItemTextProps,
  RadioGroupLabel,
  type RadioGroupLabelProps,
  type RadioGroupProps,
} from "./components/index.js";
