import {
  SelectList as ArkList,
  type SelectListProps as ArkListProps,
} from "@ark-ui/solid/select";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type SelectListProps = ArkListProps;

export function SelectList(props: SelectListProps) {
  traceLife("ui.select-list");

  return <ArkList {...dropAddress(props)} />;
}
