// КАРТА гармошки: часть паспорта → компонент, которым она рисуется (`PWEB-84`).
//
// Здесь видно, ради чего карта вообще заводилась: у гармошки пять частей, и с плоскими именами
// кита не совпадает ни одно, кроме корня. Собери такую карту потребитель — он собрал бы её по
// догадке о том, как `itemTrigger` превращается в `AccordionItemTrigger`; догадка верна ровно
// до первой части, названной иначе.
//
// Перечня частей здесь нет: ключи сверяются с анатомией — типом при написании и
// `defineKitComponent` на исполнении.

import { defineKitComponent } from "../kit-form.js";
import { passport } from "./accordion.anatomy.js";
import {
  Accordion,
  AccordionItem,
  AccordionItemContent,
  AccordionItemIndicator,
  AccordionItemTrigger,
} from "./accordion.jsx";

/** Паспорт гармошки вместе с тем, чем рисуется каждая её часть. */
export const kit = defineKitComponent(passport, {
  root: Accordion,
  item: AccordionItem,
  itemTrigger: AccordionItemTrigger,
  itemContent: AccordionItemContent,
  itemIndicator: AccordionItemIndicator,
});
