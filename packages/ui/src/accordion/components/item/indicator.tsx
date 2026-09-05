import {
  AccordionItemIndicator as ArkItemIndicator,
  type AccordionItemIndicatorProps as ArkItemIndicatorProps,
} from "@ark-ui/solid/accordion";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";
import { anatomyParts } from "../../entity/anatomy.js";

export type AccordionControlIndicatorProps = ArkItemIndicatorProps;

export function AccordionControlIndicator(props: AccordionControlIndicatorProps) {
  traceLife("ui.accordion-control-indicator");

  return <ArkItemIndicator {...dropAddress(props)} {...anatomyParts.controlIndicator.attrs} />;
}
