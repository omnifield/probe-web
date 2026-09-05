export { Accordion, type AccordionProps } from "./root.js";
export { AccordionItem, type AccordionItemProps } from "./item/index.js";
export { AccordionControl, type AccordionControlProps } from "./item/control.js";
export { AccordionControlIndicator, type AccordionControlIndicatorProps } from "./item/indicator.js";
export { AccordionContent, type AccordionContentProps } from "./item/content.js";

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { Accordion } from "./root.js";
import { AccordionItem } from "./item/index.js";
import { AccordionControl } from "./item/control.js";
import { AccordionControlIndicator } from "./item/indicator.js";
import { AccordionContent } from "./item/content.js";

export const kit = defineKitComponent(passport, {
  root: Accordion,
  item: AccordionItem,
  control: AccordionControl,
  controlIndicator: AccordionControlIndicator,
  content: AccordionContent,
});
