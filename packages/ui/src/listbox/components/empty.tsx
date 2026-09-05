import {
  ListboxEmpty as ArkEmpty,
  type ListboxEmptyProps as ArkEmptyProps,
} from "@ark-ui/solid/listbox";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type ListboxEmptyProps = ArkEmptyProps;

export function ListboxEmpty(props: ListboxEmptyProps) {
  traceLife("ui.listbox-empty");

  return <ArkEmpty {...dropAddress(props)} />;
}
