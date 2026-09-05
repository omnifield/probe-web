import {
  RadioGroupItemControl as ArkItemControl,
  type RadioGroupItemControlProps as ArkItemControlProps,
} from "@ark-ui/solid/radio-group";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type RadioGroupItemControlProps = ArkItemControlProps;

export function RadioGroupItemControl(props: RadioGroupItemControlProps) {
  traceLife("ui.radio-group-item-control");

  return <ArkItemControl {...dropAddress(props)} />;
}
