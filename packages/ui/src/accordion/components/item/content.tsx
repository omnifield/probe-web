import {
  AccordionItemContent as ArkItemContent,
  type AccordionItemContentProps as ArkItemContentProps,
} from "@ark-ui/solid/accordion";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";
import { anatomyParts } from "../../entity/anatomy.js";

export type AccordionContentProps = ArkItemContentProps;

export function AccordionContent(props: AccordionContentProps) {
  traceLife("ui.accordion-content");

  return <ArkItemContent {...dropAddress(props)} {...anatomyParts.content.attrs} />;
}
