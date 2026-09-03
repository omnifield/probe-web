import {
  SelectHiddenSelect as ArkHiddenSelect,
  type SelectHiddenSelectProps as ArkHiddenSelectProps,
} from "@ark-ui/solid/select";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type SelectHiddenSelectProps = ArkHiddenSelectProps;

export function SelectHiddenSelect(props: SelectHiddenSelectProps) {
  traceLife("ui.select-hidden-select");

  return <ArkHiddenSelect {...dropAddress(props)} />;
}
