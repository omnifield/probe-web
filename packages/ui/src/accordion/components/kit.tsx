// MAP of the accordion: passport part → the component that draws it (`PWEB-84`).
//
// The real implementations are grouped by OWNERSHIP, not held in this file — `root.tsx` for the
// set's own root, `item/` for the item and everything that only ever exists inside one (see that
// folder's own components). This file names, for each part, which of them draws it. Keys are
// checked against the anatomy — by type while writing, and by `defineKitComponent` at runtime.

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { Accordion } from "./root.js";
import { AccordionItem } from "./item/index.js";
import { AccordionItemTrigger } from "./item/trigger.js";
import { AccordionItemContent } from "./item/content.js";
import { AccordionItemIndicator } from "./item/indicator.js";

/** The accordion's passport together with whatever draws each of its parts. */
export const kit = defineKitComponent(passport, {
  root: Accordion,
  item: AccordionItem,
  itemTrigger: AccordionItemTrigger,
  itemContent: AccordionItemContent,
  itemIndicator: AccordionItemIndicator,
});
