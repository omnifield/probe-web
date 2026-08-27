// What leaves this folder outward.
//
// Two different things, two different readers: MARKUP is picked up by the primitives entry
// (`src/index.ts`), the PASSPORT by the `./passport` build, which walks folders and assembles the
// list itself.

export {
  Timer,
  TimerActionTrigger,
  type TimerActionTriggerProps,
  TimerArea,
  type TimerAreaProps,
  TimerControl,
  type TimerControlProps,
  TimerItem,
  TimerItemLabel,
  type TimerItemLabelProps,
  type TimerItemProps,
  TimerItemValue,
  type TimerItemValueProps,
  type TimerProps,
  TimerSeparator,
  type TimerSeparatorProps,
} from "./components/index.jsx";
export { kit } from "./components/kit.js";
export { anatomy, anatomyParts, passport } from "./entity";
