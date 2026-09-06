import {
  DialogTrigger as ArkTrigger,
  type DialogTriggerProps as ArkTriggerProps,
} from "@ark-ui/solid/dialog";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";
import { anatomyParts } from "../entity/anatomy.js";

export type DialogControlProps = ArkTriggerProps;

export function DialogControl(props: DialogControlProps) {
  traceLife("ui.dialog-control");

  return <ArkTrigger {...dropAddress(props)} {...anatomyParts.control.attrs} />;
}
