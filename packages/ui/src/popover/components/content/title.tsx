import {
  PopoverTitle as ArkTitle,
  type PopoverTitleProps as ArkTitleProps,
} from "@ark-ui/solid/popover";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type PopoverTitleProps = ArkTitleProps;

export function PopoverTitle(props: PopoverTitleProps) {
  traceLife("ui.popover-title");

  return <ArkTitle {...dropAddress(props)} />;
}
