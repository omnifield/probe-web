// What leaves this folder outward.
//
// Two different things, two different readers: MARKUP is picked up by the primitives entry
// (`src/index.ts`), the PASSPORT by the `./passport` build, which walks folders and assembles the
// list itself.

export {
  Tabs,
  type TabsProps,
  TabsList,
  type TabsListProps,
  TabsTrigger,
  type TabsTriggerProps,
  TabsContent,
  type TabsContentProps,
  TabsIndicator,
  type TabsIndicatorProps,
} from "./components/index.jsx";
export { kit } from "./components/kit.js";
export { anatomy, anatomyParts, passport } from "./entity";
