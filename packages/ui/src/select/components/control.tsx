import {
  SelectControl as ArkControl,
  type SelectControlProps as ArkControlProps,
} from "@ark-ui/solid/select";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type SelectControlProps = ArkControlProps;

export function SelectControl(props: SelectControlProps) {
  traceLife("ui.select-control");

  return <ArkControl {...dropAddress(props)} />;
}
