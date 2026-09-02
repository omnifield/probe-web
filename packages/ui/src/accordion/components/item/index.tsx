import {
  AccordionItem as ArkItem,
  type AccordionItemProps as ArkItemProps,
} from "@ark-ui/solid/accordion";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

/** Props of `AccordionItem`. */
export type AccordionItemProps = ArkItemProps;

/**
 * One item — ONE node plus context for its own parts. `value` is required.
 *
 * The item is exactly the reason the accordion was taken as the first composite component: it
 * has several nodes, one skin coordinate, and once dressed, every item is dressed at once.
 */
export function AccordionItem(props: AccordionItemProps) {
  traceLife("ui.accordion-item");

  return <ArkItem {...dropAddress(props)} />;
}
