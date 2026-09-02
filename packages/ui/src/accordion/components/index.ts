// OUTWARD FACE of this folder's components — a plain re-export list, nothing defined here.
//
// Real implementations are grouped by ownership: `root.tsx` for the set's own root, `item/` for
// the item and everything that only ever exists inside one — `trigger`, `content`, `indicator`
// never occur without an item around them, so their files live inside `item/` instead of flat
// next to `root.tsx`. The passport-part map (`defineKitComponent`) lives in `./kit.tsx`; this
// barrel just re-exports it, same as every other component in the kit.

export { Accordion, type AccordionProps } from "./root.js";
export { AccordionItem, type AccordionItemProps } from "./item/index.js";
export { AccordionItemTrigger, type AccordionItemTriggerProps } from "./item/trigger.js";
export { AccordionItemContent, type AccordionItemContentProps } from "./item/content.js";
export { AccordionItemIndicator, type AccordionItemIndicatorProps } from "./item/indicator.js";
export { kit } from "./kit.js";
