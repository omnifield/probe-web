import {
  AccordionItem as ArkItem,
  type AccordionItemProps as ArkItemProps,
} from "@ark-ui/solid/accordion";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type AccordionItemProps = ArkItemProps;

export function AccordionItem(props: AccordionItemProps) {
  traceLife("ui.accordion-item");

  return <ArkItem {...dropAddress(props)} />;
}
