import {
  ListboxContent as ArkContent,
  type ListboxContentProps as ArkContentProps,
} from "@ark-ui/solid/listbox";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type ListboxContentProps = ArkContentProps;

export function ListboxContent(props: ListboxContentProps) {
  traceLife("ui.listbox-content");

  return <ArkContent {...dropAddress(props)} />;
}
