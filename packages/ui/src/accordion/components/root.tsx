import {
  AccordionRoot as ArkRoot,
  type AccordionRootProps as ArkRootProps,
} from "@ark-ui/solid/accordion";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type AccordionProps = ArkRootProps;

export function Accordion(props: AccordionProps) {
  traceLife("ui.accordion");

  return <ArkRoot {...dropAddress(props)} />;
}
