// Что уезжает из папки компонента наружу.
//
// Две разные вещи и два разных читателя: РАЗМЕТКУ забирает вход примитивов (`src/index.ts`),
// ПАСПОРТ — сборка подпути `./passport`, которая обходит папки и собирает перечень сама.

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
} from "./accordion.jsx";
export { anatomy, parts, passport } from "./accordion.anatomy.js";
export { kit } from "./accordion.kit.js";
