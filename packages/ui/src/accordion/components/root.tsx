import {
  AccordionRoot as ArkRoot,
  type AccordionRootProps as ArkRootProps,
} from "@ark-ui/solid/accordion";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

/** Props of `Accordion` — the root of the item set. */
export type AccordionProps = ArkRootProps;

/**
 * The set's root — ONE node plus context.
 *
 * Holds the expanded items (`value` / `defaultValue` / `onValueChange`), `multiple` (can several
 * stay expanded at once), and `collapsible` (can the last expanded one be closed).
 *
 * @example
 * ```tsx
 * <Accordion multiple defaultValue={["shipping"]}>
 *   <AccordionItem value="shipping">
 *     <h3>
 *       <AccordionItemTrigger>
 *         Shipping
 *         <AccordionItemIndicator>▾</AccordionItemIndicator>
 *       </AccordionItemTrigger>
 *     </h3>
 *     <AccordionItemContent>Courier and pickup</AccordionItemContent>
 *   </AccordionItem>
 * </Accordion>
 * ```
 */
export function Accordion(props: AccordionProps) {
  traceLife("ui.accordion");

  return <ArkRoot {...dropAddress(props)} />;
}
