import {
  AccordionItemTrigger as ArkItemTrigger,
  type AccordionItemTriggerProps as ArkItemTriggerProps,
} from "@ark-ui/solid/accordion";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

/** Props of `AccordionItemTrigger`. */
export type AccordionItemTriggerProps = ArkItemTriggerProps;

/**
 * The expansion button — ONE `<button>` node.
 *
 * State arrives as `data-state="open" | "closed"`, disabledness as the native `disabled`
 * (Zag sets it on the button, not `data-disabled`), focus as `data-focus`.
 */
export function AccordionItemTrigger(props: AccordionItemTriggerProps) {
  traceLife("ui.accordion-item-trigger");

  return <ArkItemTrigger {...dropAddress(props)} />;
}
