import {
  DialogTitle as ArkTitle,
  type DialogTitleProps as ArkTitleProps,
} from "@ark-ui/solid/dialog";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type DialogTitleProps = ArkTitleProps;

export function DialogTitle(props: DialogTitleProps) {
  traceLife("ui.dialog-title");

  return <ArkTitle {...dropAddress(props)} />;
}
