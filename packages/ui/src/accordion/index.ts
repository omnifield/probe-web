// What leaves this folder outward.
//
// Two different things, two different readers: MARKUP is picked up by the primitives entry
// (`src/index.ts`), the PASSPORT by the `./passport` build, which walks folders and assembles the
// list itself.

export {
  Accordion,
  type AccordionProps,
  AccordionItem,
  type AccordionItemProps,
  AccordionControl,
  type AccordionControlProps,
  AccordionControlIndicator,
  type AccordionControlIndicatorProps,
  AccordionContent,
  type AccordionContentProps,
} from "./components/index.js";
