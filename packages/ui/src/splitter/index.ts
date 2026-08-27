// What leaves this folder outward.
//
// Two different things, two different readers: MARKUP is picked up by the primitives entry
// (`src/index.ts`), the PASSPORT by the `./passport` build, which walks folders and assembles the
// list itself.

export {
  Splitter,
  SplitterPanel,
  type SplitterPanelProps,
  type SplitterProps,
  SplitterResizeTrigger,
  SplitterResizeTriggerIndicator,
  type SplitterResizeTriggerIndicatorProps,
  type SplitterResizeTriggerProps,
} from "./components/index.jsx";
export { kit } from "./components/kit.js";
export { anatomy, anatomyParts, passport } from "./entity";
