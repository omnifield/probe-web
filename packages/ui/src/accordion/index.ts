// What leaves this folder outward.
//
// Two different things, two different readers: MARKUP is picked up by the primitives entry
// (`src/index.ts`), the PASSPORT by the `./passport` build, which walks folders and assembles the
// list itself.

export {
  Accordion,
  AccordionItem,
  AccordionItemContent,
  type AccordionItemContentProps,
  AccordionItemIndicator,
  type AccordionItemIndicatorProps,
  type AccordionItemProps,
  AccordionItemTrigger,
  type AccordionItemTriggerProps,
  type AccordionProps,
} from "./components/index.js";
