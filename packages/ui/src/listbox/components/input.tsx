import {
  ListboxInput as ArkInput,
  type ListboxInputProps as ArkInputProps,
} from "@ark-ui/solid/listbox";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type ListboxInputProps = ArkInputProps;

export function ListboxInput(props: ListboxInputProps) {
  traceLife("ui.listbox-input");

  return <ArkInput {...dropAddress(props)} />;
}
