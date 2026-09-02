import {
  DialogBackdrop as ArkBackdrop,
  type DialogBackdropProps as ArkBackdropProps,
} from "@ark-ui/solid/dialog";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type DialogBackdropProps = ArkBackdropProps;

export function DialogBackdrop(props: DialogBackdropProps) {
  traceLife("ui.dialog-backdrop");

  return <ArkBackdrop {...dropAddress(props)} />;
}
