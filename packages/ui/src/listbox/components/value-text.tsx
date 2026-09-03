import {
  ListboxValueText as ArkValueText,
  type ListboxValueTextProps as ArkValueTextProps,
} from "@ark-ui/solid/listbox";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type ListboxValueTextProps = ArkValueTextProps;

export function ListboxValueText(props: ListboxValueTextProps) {
  traceLife("ui.listbox-value-text");

  return <ArkValueText {...dropAddress(props)} />;
}
