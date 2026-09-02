import {
  AccordionItemContent as ArkItemContent,
  type AccordionItemContentProps as ArkItemContentProps,
} from "@ark-ui/solid/accordion";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

/** Props of `AccordionItemContent`. */
export type AccordionItemContentProps = ArkItemContentProps;

/** An item's content — ONE node; when collapsed it is hidden, not removed. */
export function AccordionItemContent(props: AccordionItemContentProps) {
  traceLife("ui.accordion-item-content");

  return <ArkItemContent {...dropAddress(props)} />;
}
