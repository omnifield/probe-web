import {
  DialogDescription as ArkDescription,
  type DialogDescriptionProps as ArkDescriptionProps,
} from "@ark-ui/solid/dialog";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type DialogDescriptionProps = ArkDescriptionProps;

export function DialogDescription(props: DialogDescriptionProps) {
  traceLife("ui.dialog-description");

  return <ArkDescription {...dropAddress(props)} />;
}
