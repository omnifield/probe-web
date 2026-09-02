import {
  DialogPositioner as ArkPositioner,
  type DialogPositionerProps as ArkPositionerProps,
} from "@ark-ui/solid/dialog";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type DialogPositionerProps = ArkPositionerProps;

export function DialogPositioner(props: DialogPositionerProps) {
  traceLife("ui.dialog-positioner");

  return <ArkPositioner {...dropAddress(props)} />;
}
