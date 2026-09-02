import {
  AccordionItemIndicator as ArkItemIndicator,
  type AccordionItemIndicatorProps as ArkItemIndicatorProps,
} from "@ark-ui/solid/accordion";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

/** Props of `AccordionItemIndicator`. */
export type AccordionItemIndicatorProps = ArkItemIndicatorProps;

/**
 * The expansion indicator — ONE node, hidden from screen readers (`aria-hidden`).
 *
 * The consumer places an arrow inside it: the kit brings no graphic of its own. Rotation is the
 * skin's job, which is exactly why the expansion state is declared on the indicator itself.
 */
export function AccordionItemIndicator(props: AccordionItemIndicatorProps) {
  traceLife("ui.accordion-item-indicator");

  return <ArkItemIndicator {...dropAddress(props)} />;
}
