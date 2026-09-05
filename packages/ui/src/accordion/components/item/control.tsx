import {
  AccordionItemTrigger as ArkItemTrigger,
  type AccordionItemTriggerProps as ArkItemTriggerProps,
} from "@ark-ui/solid/accordion";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";
import { anatomyParts } from "../../entity/anatomy.js";

export type AccordionControlProps = ArkItemTriggerProps;

export function AccordionControl(props: AccordionControlProps) {
  traceLife("ui.accordion-control");

  return <ArkItemTrigger {...dropAddress(props)} {...anatomyParts.control.attrs} />;
}
