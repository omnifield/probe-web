// MAP of the accordion: passport part → the component that draws it (`PWEB-84`).
//
// Here it is clear why the map exists at all: the accordion has five parts, and flat kit names
// match none of them except the root. Had a consumer assembled such a map themselves, they would
// have guessed how `itemTrigger` turns into `AccordionItemTrigger` — a guess right up until the
// first part named differently.
//
// There is no separate list of parts here: keys are checked against the anatomy — by type while
// writing, and by `defineKitComponent` at runtime.

import { defineKitComponent } from "../kit-form.js";
import { passport } from "./accordion.anatomy.js";
import {
  Accordion,
  AccordionItem,
  AccordionItemContent,
  AccordionItemIndicator,
  AccordionItemTrigger,
} from "./accordion.jsx";

/** The accordion's passport together with whatever draws each of its parts. */
export const kit = defineKitComponent(passport, {
  root: Accordion,
  item: AccordionItem,
  itemTrigger: AccordionItemTrigger,
  itemContent: AccordionItemContent,
  itemIndicator: AccordionItemIndicator,
});
