import {
  DialogContent as ArkContent,
  type DialogContentProps as ArkContentProps,
} from "@ark-ui/solid/dialog";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type DialogContentProps = ArkContentProps;

export function DialogContent(props: DialogContentProps) {
  traceLife("ui.dialog-content");

  return <ArkContent {...dropAddress(props)} />;
}
