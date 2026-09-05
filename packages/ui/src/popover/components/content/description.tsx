import {
  PopoverDescription as ArkDescription,
  type PopoverDescriptionProps as ArkDescriptionProps,
} from "@ark-ui/solid/popover";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type PopoverDescriptionProps = ArkDescriptionProps;

export function PopoverDescription(props: PopoverDescriptionProps) {
  traceLife("ui.popover-description");

  return <ArkDescription {...dropAddress(props)} />;
}
