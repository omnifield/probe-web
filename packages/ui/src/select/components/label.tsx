import {
  SelectLabel as ArkLabel,
  type SelectLabelProps as ArkLabelProps,
} from "@ark-ui/solid/select";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type SelectLabelProps = ArkLabelProps;

export function SelectLabel(props: SelectLabelProps) {
  traceLife("ui.select-label");

  return <ArkLabel {...dropAddress(props)} />;
}
