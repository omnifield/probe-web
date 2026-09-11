import {
  AccordionRoot as ArkRoot,
  type AccordionRootProps as ArkRootProps,
} from "@ark-ui/solid/accordion";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { useKitLife } from "../../shared/utils/skin-life.js";
import { passport } from "../entity/passport.js";

export type AccordionProps = ArkRootProps;

export function Accordion(props: AccordionProps) {
  useKitLife(passport, props);

  return <ArkRoot {...dropAddress(props)} />;
}
