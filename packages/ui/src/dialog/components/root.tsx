import {
  DialogRoot as ArkRoot,
  type DialogRootProps as ArkRootProps,
} from "@ark-ui/solid/dialog";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type DialogProps = ArkRootProps;

export function Dialog(props: DialogProps) {
  traceLife("ui.dialog");

  return <ArkRoot {...dropAddress(props)} />;
}
