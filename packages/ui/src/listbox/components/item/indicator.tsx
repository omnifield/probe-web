import {
  ListboxItemIndicator as ArkItemIndicator,
  type ListboxItemIndicatorProps as ArkItemIndicatorProps,
} from "@ark-ui/solid/listbox";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";

export type ListboxItemIndicatorProps = ArkItemIndicatorProps;

export function ListboxItemIndicator(props: ListboxItemIndicatorProps) {
  traceLife("ui.listbox-item-indicator");

  return <ArkItemIndicator {...dropAddress(props)} />;
}
